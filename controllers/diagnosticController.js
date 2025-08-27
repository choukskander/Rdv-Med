const asyncHandler = require('express-async-handler');
const { PythonShell } = require('python-shell');
const Symptom = require('../models/Symptom');
const path = require('path');
const { execSync } = require('child_process'); // Pour exécuter une commande système

// Fonction pour normaliser les chaînes
const normalizeString = (str) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
};

// Fonction pour détecter le chemin de Python
const getPythonPath = () => {
  try {
    const pythonPath = execSync('where python', { encoding: 'utf8' }).split('\n')[0].trim();
    if (pythonPath && require('fs').existsSync(pythonPath)) {
      console.log(`✅ Python path detected: ${pythonPath}`);
      return pythonPath;
    }
    throw new Error('Python not found in system PATH');
  } catch (error) {
    console.error('❌ Error detecting Python path:', error.message);
    throw new Error('Python executable not found. Please install Python and ensure it is in your system PATH.');
  }
};

exports.getSymptoms = asyncHandler(async (req, res) => {
  const { lang } = req.params;
  console.log(`Récupération des symptômes pour la langue : ${lang}`);
  console.log('Fichier chargé :', __filename);
  const symptoms = await Symptom.find({ language: lang }).select('name');
  res.json(symptoms.map(s => s.name));
});

exports.diagnose = asyncHandler(async (req, res) => {
  console.log('Fichier chargé :', __filename);
  console.log('Requête POST /api/diagnostic reçue:', req.body);
  const { symptoms, text, lang } = req.body;

  let finalSymptoms = symptoms || [];
  if (text) {
    finalSymptoms = text.toLowerCase().split(/\s+/).filter(s => s);
  }

  if (!finalSymptoms.length) {
    console.log('Erreur: Aucun symptôme fourni');
    return res.status(400).json({ message: 'No symptoms provided or detected.' });
  }

  finalSymptoms = finalSymptoms.map(normalizeString);
  console.log('Symptômes finaux après normalisation :', finalSymptoms);
  console.log('Langue :', lang);

  const inputData = JSON.stringify({ symptoms: finalSymptoms, lang });
  console.log('Données JSON envoyées au script Python :', inputData);

  const pythonPath = getPythonPath(); // Détecte dynamiquement le chemin
  const options = {
    mode: 'text',
    pythonPath: pythonPath,
    pythonOptions: ['-u'],
    scriptPath: path.resolve(__dirname, '..'),
    args: [inputData]
  };

  console.log('Exécution de PythonShell.run avec options :', options);
  console.log('🚀 Chemin Python utilisé :', options.pythonPath);

  try {
    const result = await new Promise((resolve, reject) => {
      const shell = new PythonShell('clips_diagnose.py', options);
      
      let output = '';
      let errorOutput = '';

      shell.on('message', (message) => {
        output += message + '\n';
        console.log('Python stdout:', message);
      });

      shell.on('stderr', (stderr) => {
        errorOutput += stderr + '\n';
        console.log('Python stderr:', stderr);
      });

      shell.on('close', () => {
        if (errorOutput) {
          try {
            const errorJson = JSON.parse(errorOutput.trim());
            if (errorJson.status === 'error') {
              console.error('Python script error output (parsed):', errorJson);
              reject(new Error(errorJson.message || 'Python script failed'));
            } else {
              console.log('Python stderr contains logs, not errors:', errorOutput);
            }
          } catch (parseErr) {
            console.log('stderr output is not JSON, treating as logs:', errorOutput);
          }
        }
        if (!output.trim()) {
          reject(new Error('No output received from Python script'));
        } else {
          console.log('Python script completed. Raw output:', output);
          try {
            const parsedOutput = JSON.parse(output.trim());
            resolve(parsedOutput);
          } catch (parseErr) {
            console.error('Erreur lors du parsing du résultat Python :', parseErr);
            reject(new Error(`Invalid JSON output: ${parseErr.message}`));
          }
        }
      });

      shell.on('error', (err) => {
        console.error('Erreur de python-shell :', err);
        reject(err);
      });
    });

    console.log('Résultat après exécution du script Python :', result);
    if (result.status !== 'success') {
      return res.status(500).json({ message: result.message || 'Error during diagnosis' });
    }

    const TRANSLATIONS = {
      en: { no_disease_detected: 'No disease detected. Please add more symptoms.', probably_have: 'You might have:', precautions: 'Precautions:' },
      fr: { no_disease_detected: 'Votre maladie n\'est pas détectée, veuillez ajouter plus de symptôme(s)', probably_have: 'Vous avez probablement:', precautions: 'Précautions:' },
      ar: { no_disease_detected: 'لم يتم اكتشاف مرضك، يرجى إضافة المزيد من الأعراض', probably_have: 'ربما لديك:', precautions: 'احتياطات:' }
    };

    res.json({
      status: 'success',
      diseases: result.diseases,
      messages: TRANSLATIONS[lang || 'en']
    });
  } catch (error) {
    console.error('Erreur globale dans diagnose :', error);
    res.status(500).json({ message: 'Internal server error during diagnosis', error: error.message });
  }
});