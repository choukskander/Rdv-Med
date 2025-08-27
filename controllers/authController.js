// const mongoose = require('mongoose');
// const User = require("../models/User");
// const Notification = require('../models/Notification'); 
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
// const cloudinary = require('cloudinary').v2;
// const asyncHandler = require('express-async-handler');
// const sendEmail = require('../utils/sendEmail'); 

// const path = require('path');
// const fs = require('fs');

// // Créer le dossier uploads s'il n'existe pas
// const uploadDir = path.join(__dirname, '../uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
// };

// exports.register = asyncHandler(async (req, res) => {
//   console.log("Register - Request body:", req.body, "Files:", req.files);

//   const { nom, prenom, email, password, role, specialite } = req.body;
//   const licenceProfessionnelle = req.files?.licenceProfessionnelle;

//   if (!nom || !prenom || !email || !password || !role) {
//     return res.status(400).json({ message: "Tous les champs sont requis." });
//   }

//   if (role === "internaute" && (!specialite || !licenceProfessionnelle)) {
//     return res.status(400).json({
//       message: "La spécialité et la licence professionnelle sont requises pour les internautes.",
//     });
//   }

//   const existingUser = await User.findOne({ email });
//   if (existingUser) {
//     return res.status(400).json({ message: "Un utilisateur avec cet email existe déjà." });
//   }

//   // Validate and save licenceProfessionnelle to uploads
//   let licencePath;
//   if (licenceProfessionnelle) {
//     const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
//     if (!allowedTypes.includes(licenceProfessionnelle.mimetype)) {
//       return res.status(400).json({ message: "Seuls les fichiers JPG, PNG et PDF sont autorisés pour la licence." });
//     }
//     if (licenceProfessionnelle.size > 5 * 1024 * 1024) {
//       return res.status(400).json({ message: "La licence ne doit pas dépasser 5MB." });
//     }

//     try {
//       const timestamp = Date.now();
//       const fileName = `${timestamp}-${licenceProfessionnelle.name}`;
//       const filePath = path.join(uploadDir, fileName);

//       // Déplacer le fichier vers le dossier uploads
//       await licenceProfessionnelle.mv(filePath);
//       licencePath = `/uploads/${fileName}`; // Chemin relatif stocké dans la base de données
//     } catch (error) {
//       console.error('Error saving licence to uploads:', error);
//       return res.status(500).json({ message: "Erreur lors de l'enregistrement de la licence." });
//     }
//   }

//   const hashedPassword = await bcrypt.hash(password, 10);

//   const newUser = new User({
//     nom,
//     prenom,
//     email,
//     password: hashedPassword,
//     role,
//     specialite: role === "internaute" ? specialite : undefined,
//     licenceProfessionnelle: licencePath,
//     validated: role === "admin" ? true : false, // Admins are validated by default, others (e.g., doctors) are not
//   });

//   await newUser.save();

//   // Create notification for admins if the new user is a doctor (internaute)
//   if (newUser.role === "internaute") {
//     const admins = await User.find({ role: "admin" });
//     for (const admin of admins) {
//       await Notification.create({
//         recipientId: admin._id,
//         message: `Nouveau médecin en attente de validation : ${newUser.nom} ${newUser.prenom}`,
//         type: "doctor_validation",
//         doctorId: newUser._id,
//         read: false,
//       });
//     }
//   }

//   const token = generateToken(newUser._id);

//   res.status(201).json({
//     message: "Inscription réussie.",
//     token,
//     user: {
//       _id: newUser._id,
//       nom: newUser.nom,
//       prenom: newUser.prenom,
//       email: newUser.email,
//       role: newUser.role,
//       specialite: newUser.specialite,
//       licenceProfessionnelle: newUser.licenceProfessionnelle,
//     },
//   });
// });

// exports.login = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;

//   const user = await User.findOne({ email });

//   if (user && (await bcrypt.compare(password, user.password))) {
//     res.json({
//       _id: user._id,
//       nom: user.nom,
//       prenom: user.prenom,
//       email: user.email,
//       role: user.role,
//       specialite: user.specialite,
//       licenceProfessionnelle: user.licenceProfessionnelle,
//       profileImage: user.profileImage,
//       token: generateToken(user._id),
//     });
//   } else {
//     res.status(401).json({ message: "Identifiants invalides" });
//   }
// });

// exports.updateUserProfile = asyncHandler(async (req, res) => {
//   console.log('Update Profile - Request body:', req.body, 'Files:', req.files);

//   const user = await User.findById(req.user.id);
//   if (!user) {
//     return res.status(404).json({ message: 'Utilisateur non trouvé' });
//   }

//   const { nom, prenom, email, password, specialite, ville, localisation } = req.body;
//   const profileImage = req.files?.profileImage;

//   // Validate email uniqueness
//   if (email && email !== user.email) {
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: "Cet email est déjà utilisé." });
//     }
//   }

//   // Update fields
//   user.nom = nom || user.nom;
//   user.prenom = prenom || user.prenom;
//   user.email = email || user.email;
//   if (user.role === 'internaute') {
//     user.specialite = specialite || user.specialite;
//     user.ville = ville || user.ville;
//     user.localisation = localisation || user.localisation;
//   }
//   if (password && password.trim() !== '') {
//     user.password = await bcrypt.hash(password, 10);
//   }

//   // Handle profile image
//   if (profileImage) {
//     const allowedTypes = ['image/jpeg', 'image/png'];
//     if (!allowedTypes.includes(profileImage.mimetype)) {
//       return res.status(400).json({ message: "Seuls les fichiers JPG et PNG sont autorisés pour l'image de profil." });
//     }
//     if (profileImage.size > 5 * 1024 * 1024) {
//       return res.status(400).json({ message: "L'image de profil ne doit pas dépasser 5MB." });
//     }

//     try {
//       const result = await cloudinary.uploader.upload(profileImage.tempFilePath, {
//         folder: 'user_profiles',
//         resource_type: 'image',
//       });
//       user.profileImage = result.secure_url;
//     } catch (error) {
//       console.error('Cloudinary upload error (profile):', error);
//       return res.status(500).json({ message: "Erreur lors du téléchargement de l'image de profil." });
//     }
//   }

//   const updatedUser = await user.save();

//   res.json({
//     _id: updatedUser._id,
//     nom: updatedUser.nom,
//     prenom: updatedUser.prenom,
//     email: updatedUser.email,
//     role: updatedUser.role,
//     specialite: updatedUser.specialite,
//     profileImage: updatedUser.profileImage,
//     ville: updatedUser.ville,
//     localisation: updatedUser.localisation,
//   });
// });

// // Récupérer les users profil
// exports.getUserProfile = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user.id);
//   if (!user) {
//     return res.status(404).json({ message: 'Utilisateur non trouvé' });
//   }

//   res.json({
//     _id: user._id,
//     nom: user.nom,
//     prenom: user.prenom,
//     email: user.email,
//     role: user.role,
//     specialite: user.specialite,
//     profileImage: user.profileImage,
//     ville: user.ville,
//     localisation: user.localisation,
//     validated: user.validated,
//   });
// });
// // Récupérer les spécialités uniques
// exports.getSpecialites = asyncHandler(async (req, res) => {
//   try {
//     // Récupérer les spécialités uniques avec distinct
//     const specialites = await User.distinct('specialite');
//     // Ajouter une option par défaut
//     const specialitesList = [
//       { value: '', label: 'Sélectionner une spécialité' },
//       ...specialites
//         .filter(specialite => specialite) // Filtrer les valeurs nulles ou vides
//         .map(specialite => ({ value: specialite, label: specialite }))
//     ];
//     res.json(specialitesList);
//   } catch (err) {
//     console.error('Erreur lors de la récupération des spécialités:', err);
//     res.status(500).json({ message: 'Erreur serveur lors de la récupération des spécialités.' });
//   }
// });
// exports.searchDoctorsByCity = asyncHandler(async (req, res) => {
//   const { nom, specialite, ville } = req.query;
//   console.log('searchDoctorsByCity - Requête reçue:', { nom, specialite, ville });

//   // Vérifier qu'au moins un critère est fourni
//   if (!nom && !specialite && !ville) {
//     return res.status(400).json({ message: 'Au moins un critère de recherche (nom, spécialité ou ville) est requis.' });
//   }

//   // Construire la requête MongoDB
//   const query = {
//     role: 'internaute',
//     validated: true,
//   };

//   // Ajouter le filtre par nom si fourni
//   if (nom) {
//     query.$or = [
//       { nom: { $regex: nom, $options: 'i' } },
//       { prenom: { $regex: nom, $options: 'i' } },
//     ];
//   }

//   // Ajouter le filtre par spécialité si fourni
//   if (specialite) {
//     query.specialite = { $regex: specialite, $options: 'i' };
//   }

//   // Ajouter le filtre par ville si fourni
//   if (ville) {
//     query.ville = { $regex: ville, $options: 'i' };
//   }

//   try {
//     const doctors = await User.find(query).select('nom prenom specialite ville localisation profileImage');
//     console.log('searchDoctorsByCity - Résultat:', doctors);

//     if (doctors.length === 0) {
//       return res.json({
//         message: `Aucun médecin trouvé pour les critères spécifiés.`,
//         doctors: [],
//       });
//     }

//     res.json(doctors);
//   } catch (error) {
//     console.error('searchDoctorsByCity - Erreur:', error);
//     res.status(500).json({ message: 'Erreur serveur lors de la recherche.' });
//   }
// });
// // Mettre à jour les horaires du médecin
// // Mettre à jour les horaires d'un médecin
// exports.updateDoctorSchedule = asyncHandler(async (req, res) => {
//   if (!req.user || !req.user.id) {
//     return res.status(401).json({ message: 'Utilisateur non authentifié.' });
//   }

//   const user = await User.findById(req.user.id);
//   if (!user) {
//     return res.status(404).json({ message: 'Utilisateur non trouvé.' });
//   }
//   if (user.role !== 'internaute') {
//     return res.status(403).json({ message: 'Seuls les médecins peuvent mettre à jour leurs horaires.' });
//   }

//   const { horaires } = req.body;
//   if (!horaires || typeof horaires !== 'object') {
//     return res.status(400).json({ message: 'Les horaires doivent être fournis sous forme d\'objet.' });
//   }

//   // Valider les horaires
//   const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
//   for (const day of days) {
//     if (horaires[day]) {
//       const { ouverture, fermeture, ferme } = horaires[day];
//       if (ferme === true) {
//         horaires[day] = { ouverture: '', fermeture: '', ferme: true };
//       } else {
//         if (!ouverture || !fermeture || !/^\d{2}:\d{2}$/.test(ouverture) || !/^\d{2}:\d{2}$/.test(fermeture)) {
//           return res.status(400).json({ message: `Format invalide pour les horaires du ${day}. Utilisez HH:MM.` });
//         }
//         horaires[day].ferme = false;
//       }
//     }
//   }

//   user.horaires = horaires;
//   await user.save();

//   res.json({ message: 'Horaires mis à jour avec succès.', horaires: user.horaires });
// });

// // Récupérer les horaires d'un médecin spécifique
// exports.getDoctorSchedule = asyncHandler(async (req, res) => {
//   const { doctorId } = req.params;
//   console.log('Received request for doctorId:', doctorId);

//   // Check if doctorId is a valid ObjectId
//   if (!mongoose.Types.ObjectId.isValid(doctorId)) {
//     console.log('Invalid doctorId format:', doctorId);
//     return res.status(400).json({ message: 'ID de médecin invalide.' });
//   }

//   console.log('Querying database for user with ID:', doctorId);
//   const doctor = await User.findById(doctorId).select('horaires nom prenom specialite role');
//   if (!doctor) {
//     console.log('Doctor not found for ID:', doctorId);
//     return res.status(404).json({ message: 'Médecin non trouvé.' });
//   }

//   console.log('Doctor found:', doctor);
//   if (doctor.role !== 'internaute') {
//     console.log('User is not a doctor. Role:', doctor.role);
//     return res.status(404).json({ message: 'Médecin non trouvé.' });
//   }

//   console.log('Returning schedule for doctor:', doctorId);
//   res.json({ horaires: doctor.horaires, doctor: { nom: doctor.nom, prenom: doctor.prenom, specialite: doctor.specialite } });
// });

// // Récupérer les horaires d'un médecin pour les patients avec créneaux disponibles
// exports.getDoctorScheduleForPatient = asyncHandler(async (req, res) => {
//   const { doctorId } = req.params;
//   const { date } = req.query; // Date au format YYYY-MM-DD
//   console.log('Patient requesting schedule for doctorId:', doctorId, 'on date:', date);

//   if (!mongoose.Types.ObjectId.isValid(doctorId)) {
//     console.log('Invalid doctorId format:', doctorId);
//     return res.status(400).json({ message: 'ID de médecin invalide.' });
//   }

//   // Vérifier que l'utilisateur authentifié est un patient
//   console.log('Rôle de l\'utilisateur:', req.user.role);
//   if (req.user.role !== 'patient') {
//     console.log('Access denied. User role:', req.user.role);
//     return res.status(403).json({ message: 'Accès refusé. Seuls les patients peuvent consulter les horaires.' });
//   }

//   console.log('Querying database for user with ID:', doctorId);
//   const doctor = await User.findById(doctorId).select('horaires nom prenom specialite role');
//   if (!doctor) {
//     console.log('Doctor not found for ID:', doctorId);
//     return res.status(404).json({ message: 'Médecin non trouvé.' });
//   }

//   console.log('Doctor found:', doctor);
//   if (doctor.role !== 'internaute') {
//     console.log('User is not a doctor. Role:', doctor.role);
//     return res.status(404).json({ message: 'Médecin non trouvé.' });
//   }

//   // Si aucune date n'est fournie, retourner uniquement les horaires généraux
//   if (!date) {
//     console.log('No date provided, returning general schedule for doctor:', doctorId);
//     return res.json({
//       horaires: doctor.horaires,
//       doctor: { nom: doctor.nom, prenom: doctor.prenom, specialite: doctor.specialite },
//     });
//   }

//   // Valider la date
//   const selectedDate = new Date(date);
//   if (isNaN(selectedDate.getTime())) {
//     return res.status(400).json({ message: 'Date invalide. Utilisez le format YYYY-MM-DD.' });
//   }

//   // Vérifier si la date est dans le passé par rapport à la date et l'heure actuelles
//   const now = new Date();
//   if (selectedDate < now) {
//     return res.status(400).json({ message: 'Vous ne pouvez pas prendre de rendez-vous dans le passé.' });
//   }

//   const dayName = selectedDate.toLocaleString('fr-FR', { weekday: 'long' }).toLowerCase();
//   const horaires = doctor.horaires[dayName];

//   if (horaires.ferme) {
//     return res.status(400).json({ message: `Le médecin est fermé le ${dayName}.` });
//   }

//   // Générer les créneaux horaires disponibles (par intervalles de 30 minutes)
//   const [openHour, openMinute] = horaires.ouverture.split(':').map(Number);
//   const [closeHour, closeMinute] = horaires.fermeture.split(':').map(Number);

//   let startTime = openHour * 60 + openMinute;
//   const endTime = closeHour * 60 + closeMinute;
//   const interval = 30; // Créneaux de 30 minutes
//   let availableSlots = [];

//   // Ajuster l'heure de début si la date est aujourd'hui
//   if (selectedDate.toDateString() === now.toDateString()) {
//     const currentHour = now.getHours();
//     const currentMinute = now.getMinutes();
//     const currentTime = currentHour * 60 + currentMinute;
//     startTime = Math.max(startTime, currentTime + interval); // Commencer après l'heure actuelle
//   }

//   // Générer les créneaux
//   while (startTime + interval <= endTime) {
//     const slotHour = Math.floor(startTime / 60);
//     const slotMinute = startTime % 60;
//     const slotTime = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
//     availableSlots.push(slotTime);
//     startTime += interval;
//   }

//   // Récupérer les rendez-vous existants pour ce jour
//   const startOfDay = new Date(selectedDate);
//   startOfDay.setHours(0, 0, 0, 0);
//   const endOfDay = new Date(selectedDate);
//   endOfDay.setHours(23, 59, 59, 999);

//   const existingAppointments = await Appointment.find({
//     doctorId,
//     date: { $gte: startOfDay, $lte: endOfDay },
//     status: { $in: ['confirmed', 'pending'] }, // Exclure les annulés
//   });

//   // Filtrer les créneaux déjà pris
//   const bookedSlots = existingAppointments.map((appointment) => {
//     const date = new Date(appointment.date);
//     return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
//   });

//   availableSlots = availableSlots.filter((slot) => !bookedSlots.includes(slot));

//   res.json({
//     horaires: doctor.horaires,
//     doctor: { nom: doctor.nom, prenom: doctor.prenom, specialite: doctor.specialite },
//     availableSlots,
//     selectedDate: selectedDate.toISOString().split('T')[0],
//   });
// });

// // Prendre un rendez-vous
// exports.bookAppointment = asyncHandler(async (req, res) => {
//   const { doctorId, date, time } = req.body;
//   const patientId = req.user.id;

//   const doctor = await User.findById(doctorId);
//   if (!doctor || doctor.role !== 'internaute') {
//     return res.status(404).json({ message: 'Médecin non trouvé.' });
//   }

//   const patient = await User.findById(patientId);
//   if (!patient || patient.role !== 'patient') {
//     return res.status(403).json({ message: 'Seuls les patients peuvent prendre des rendez-vous.' });
//   }

//   // Construire la date et l'heure du rendez-vous
//   const [hours, minutes] = time.split(':').map(Number);
//   const appointmentDate = new Date(date);
//   appointmentDate.setHours(hours, minutes, 0, 0);

//   // Vérifier si la date est dans le passé
//   const now = new Date();
//   if (appointmentDate < now) {
//     return res.status(400).json({ message: 'Vous ne pouvez pas prendre de rendez-vous dans le passé.' });
//   }

//   const dayName = appointmentDate.toLocaleString('fr-FR', { weekday: 'long' }).toLowerCase();
//   const horaires = doctor.horaires[dayName];

//   if (horaires.ferme) {
//     return res.status(400).json({ message: `Le médecin est fermé le ${dayName}.` });
//   }

//   const [openHour, openMinute] = horaires.ouverture.split(':').map(Number);
//   const [closeHour, closeMinute] = horaires.fermeture.split(':').map(Number);
//   const appointmentHour = appointmentDate.getHours();
//   const appointmentMinute = appointmentDate.getMinutes();

//   const openTime = openHour * 60 + openMinute;
//   const closeTime = closeHour * 60 + closeMinute;
//   const appointmentTime = appointmentHour * 60 + appointmentMinute;

//   if (appointmentTime < openTime || appointmentTime >= closeTime) {
//     return res.status(400).json({ message: 'Le créneau horaire est en dehors des heures d\'ouverture.' });
//   }

//   // Vérifier si un rendez-vous existe déjà à ce créneau (par exemple, intervalle de 30 minutes)
//   const existingAppointment = await Appointment.findOne({
//     doctorId,
//     date: {
//       $gte: new Date(appointmentDate.getTime() - 15 * 60 * 1000), // 15 minutes avant
//       $lte: new Date(appointmentDate.getTime() + 15 * 60 * 1000), // 15 minutes après
//     },
//     status: { $in: ['confirmed', 'pending'] }, // Exclure les annulés
//   });

//   if (existingAppointment) {
//     return res.status(400).json({ message: 'Ce créneau est déjà pris.' });
//   }

//   const newAppointment = new Appointment({
//     doctorId,
//     patientId,
//     date: appointmentDate,
//     status: 'pending', // Statut initial
//   });

//   await newAppointment.save();

//   res.status(201).json({ message: 'Rendez-vous pris avec succès.', appointment: newAppointment });
// });
// // **************************Admin

// // Récupérer tous les comptes (pour admin uniquement)
// exports.getAllUsers = asyncHandler(async (req, res) => {
//   console.log('Admin requesting all users');
//   const users = await User.find().select('-password');
//   console.log('Users found:', users);
//   res.status(200).json(users);
// });

// // Mettre à jour un compte (pour admin uniquement)
// exports.updateUser = asyncHandler(async (req, res) => {
//   const { userId } = req.params;
//   const updates = req.body;

//   console.log('Admin updating user:', { userId, updates });

//   if (updates.password) {
//     return res.status(400).json({ message: 'La modification du mot de passe n’est pas autorisée via cet endpoint.' });
//   }

//   if (updates.role === 'admin') {
//     return res.status(403).json({ message: 'Impossible de créer un autre compte admin via cet endpoint.' });
//   }

//   const user = await User.findById(userId);
//   if (!user) {
//     console.log('User not found for ID:', userId);
//     return res.status(404).json({ message: 'Utilisateur non trouvé.' });
//   }

//   Object.assign(user, updates);
//   user.updatedAt = Date.now();
//   await user.save();

//   console.log('User updated:', user);
//   res.status(200).json({ message: 'Utilisateur mis à jour avec succès.', user });
// });

// // Supprimer un compte (pour admin uniquement)
// exports.deleteUser = asyncHandler(async (req, res) => {
//   const { userId } = req.params;
//   console.log('Admin deleting user:', userId);

//   const user = await User.findById(userId);
//   if (!user) {
//     console.log('User not found for ID:', userId);
//     return res.status(404).json({ message: 'Utilisateur non trouvé.' });
//   }

//   // Empêcher la suppression d’un compte admin
//   if (user.role === 'admin') {
//     return res.status(403).json({ message: 'Impossible de supprimer un compte admin.' });
//   }

//   await user.deleteOne(); // Remplacer user.remove() par user.deleteOne()
//   console.log('User deleted:', userId);
//   res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
// });

// // Valider la licence d’un médecin (pour admin uniquement)
// exports.validateDoctorLicense = asyncHandler(async (req, res) => {
//   const { userId } = req.params;
//   console.log('Admin validating doctor license for userId:', userId);

//   // Find the user (doctor)
//   const user = await User.findById(userId);
//   if (!user) {
//     console.log('User not found for ID:', userId);
//     return res.status(404).json({ message: 'Utilisateur non trouvé.' });
//   }

//   // Verify that the user is a doctor (role: 'internaute')
//   if (user.role !== 'internaute') {
//     console.log('User is not a doctor. Role:', user.role);
//     return res.status(400).json({ message: 'Cet utilisateur n’est pas un médecin.' });
//   }

//   // Update the validated status
//   user.validated = true;
//   user.updatedAt = Date.now();
//   await user.save();

//   // Send an email to the doctor
//   const doctorEmail = user.email;
//   const doctorName = `${user.prenom} ${user.nom}`;
//   const subject = 'Validation de votre compte médecin';
//   const text = `Bonjour Dr. ${doctorName},\n\nVotre compte sur la plateforme Rdv-Med a été validé avec succès par l'administrateur.\nVous pouvez maintenant commencer à accepter des rendez-vous.\n\nCordialement,\nL'équipe de Rdv-Med`;
//   const html = `
//     <h2>Bonjour Dr. ${doctorName},</h2>
//     <p>Votre compte sur la plateforme <strong>Rdv-Med</strong> a été validé avec succès par l'administrateur.</p>
//     <p>Vous pouvez maintenant commencer à accepter des rendez-vous.</p>
//     <p>Cordialement,<br>L'équipe de Rdv-Med</p>
//   `;

//   try {
//     await sendEmail({
//       to: doctorEmail,
//       subject,
//       text,
//       html,
//     });
//     console.log(`Validation email sent to ${doctorEmail}`);
//   } catch (error) {
//     console.error(`Failed to send validation email to ${doctorEmail}:`, error);
//     // Note: We don't fail the request if the email fails; we just log the error
//   }

//   console.log('Doctor license validated:', user);
//   res.status(200).json({ message: 'Licence du médecin validée avec succès.', user });
// });

// exports.getDoctorsBySpecialty = asyncHandler(async (req, res) => {
//   try {
//     // Aggregate users by specialty for validated internautes
//     const specialties = await User.aggregate([
//       {
//         $match: {
//           role: 'internaute',
//           validated: true,
//         },
//       },
//       {
//         $group: {
//           _id: { $ifNull: ['$specialite', 'Non spécifiée'] }, // Handle missing specialties
//           count: { $sum: 1 },
//         },
//       },
//       { $sort: { '_id': 1 } },
//     ]);

//     console.log('Doctors by specialty aggregation result:', specialties);

//     // Format the result for the pie chart
//     const data = specialties.map((item) => ({
//       name: item._id,
//       value: item.count,
//     }));

//     res.json(data);
//   } catch (error) {
//     console.error('Error fetching doctors by specialty:', error.message, error.stack);
//     res.status(500).json({ message: 'Erreur lors de la récupération des données.' });
//   }
// });
const mongoose = require('mongoose');
const User = require("../models/User");
const Notification = require('../models/Notification');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cloudinary = require('cloudinary').v2;
const asyncHandler = require('express-async-handler');
const sendEmail = require('../utils/sendEmail');
const path = require('path');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadDir = path.join(__dirname, '../Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const generateTempToken = (id) => {
  return jwt.sign({ id, temp: true }, process.env.JWT_SECRET, { expiresIn: '10m' });
};

const generate2FACode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Existing register function (unchanged)
exports.register = asyncHandler(async (req, res) => {
  console.log("Register - Request body:", req.body, "Files:", req.files);
  const { nom, prenom, email, password, role, specialite } = req.body;
  const licenceProfessionnelle = req.files?.licenceProfessionnelle;

  if (!nom || !prenom || !email || !password || !role) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  if (role === "internaute" && (!specialite || !licenceProfessionnelle)) {
    return res.status(400).json({
      message: "La spécialité et la licence professionnelle sont requises pour les internautes.",
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "Un utilisateur avec cet email existe déjà." });
  }

  let licencePath;
  if (licenceProfessionnelle) {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(licenceProfessionnelle.mimetype)) {
      return res.status(400).json({ message: "Seuls les fichiers JPG, PNG et PDF sont autorisés pour la licence." });
    }
    if (licenceProfessionnelle.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "La licence ne doit pas dépasser 5MB." });
    }

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${licenceProfessionnelle.name}`;
      const filePath = path.join(uploadDir, fileName);
      await licenceProfessionnelle.mv(filePath);
      licencePath = `/uploads/${fileName}`;
    } catch (error) {
      console.error('Error saving licence to uploads:', error);
      return res.status(500).json({ message: "Erreur lors de l'enregistrement de la licence." });
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    nom,
    prenom,
    email,
    password: hashedPassword,
    role,
    specialite: role === "internaute" ? specialite : undefined,
    licenceProfessionnelle: licencePath,
    validated: role === "admin" ? true : false,
  });

  await newUser.save();

  if (newUser.role === "internaute") {
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await Notification.create({
        recipientId: admin._id,
        message: `Nouveau médecin en attente de validation : ${newUser.nom} ${newUser.prenom}`,
        type: "doctor_validation",
        doctorId: newUser._id,
        read: false,
      });
    }
  }

  const token = generateToken(newUser._id);

  res.status(201).json({
    message: "Inscription réussie.",
    token,
    user: {
      _id: newUser._id,
      nom: newUser.nom,
      prenom: newUser.prenom,
      email: newUser.email,
      role: newUser.role,
      specialite: newUser.specialite,
      licenceProfessionnelle: newUser.licenceProfessionnelle,
    },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email });

  const user = await User.findOne({ email });
  if (!user) {
    console.log('User not found for email:', email);
    return res.status(401).json({ message: "Identifiants invalides" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    console.log('Invalid password for user:', email);
    return res.status(401).json({ message: "Identifiants invalides" });
  }

  // Skip 2FA for admin
  if (user.role === 'admin') {
    console.log('Admin login, skipping 2FA for user:', email);
    return res.json({
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      specialite: user.specialite,
      licenceProfessionnelle: user.licenceProfessionnelle,
      profileImage: user.profileImage,
      token: generateToken(user._id),
    });
  }

  // Generate and save 2FA code for non-admin users
  const code = generate2FACode();
  user.twoFactorCode = code;
  user.twoFactorExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  try {
    await user.save();
    console.log('2FA code saved for user:', email, 'Code:', code);
  } catch (error) {
    console.error('Error saving 2FA code:', error);
    return res.status(500).json({ message: "Erreur lors de l'enregistrement du code 2FA." });
  }

  // Send 2FA code via email
  const subject = 'Votre code de vérification à deux facteurs';
  const text = `Bonjour ${user.prenom} ${user.nom},\n\nVotre code de vérification à deux facteurs est : ${code}\nCe code expire dans 10 minutes.\n\nCordialement,\nL'équipe Rdv-Med`;
  const html = `
    <h2>Bonjour ${user.prenom} ${user.nom},</h2>
    <p>Votre code de vérification à deux facteurs est : <strong>${code}</strong></p>
    <p>Ce code expire dans 10 minutes.</p>
    <p>Cordialement,<br>L'équipe Rdv-Med</p>
  `;

  try {
    await sendEmail({ to: user.email, subject, text, html });
    const tempToken = generateTempToken(user._id);
    console.log('2FA email sent and tempToken generated for user:', email, 'TempToken:', tempToken);
    res.json({ message: "Code 2FA envoyé.", tempToken });
  } catch (error) {
    console.error('Error sending 2FA email:', error);
    return res.status(500).json({ message: "Erreur lors de l'envoi du code 2FA." });
  }
});

// ... (other exports remain unchanged)
exports.updateUserProfile = asyncHandler(async (req, res) => {
  console.log('Update Profile - Request body:', req.body, 'Files:', req.files);
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
  }

  const { nom, prenom, email, password, specialite, ville, localisation } = req.body;
  const profileImage = req.files?.profileImage;

  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }
  }

  user.nom = nom || user.nom;
  user.prenom = prenom || user.prenom;
  user.email = email || user.email;
  if (user.role === 'internaute') {
    user.specialite = specialite || user.specialite;
    user.ville = ville || user.ville;
    user.localisation = localisation || user.localisation;
  }
  if (password && password.trim() !== '') {
    user.password = await bcrypt.hash(password, 10);
  }

  if (profileImage) {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(profileImage.mimetype)) {
      return res.status(400).json({ message: "Seuls les fichiers JPG et PNG sont autorisés pour l'image de profil." });
    }
    if (profileImage.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "L'image de profil ne doit pas dépasser 5MB." });
    }

    try {
      const result = await cloudinary.uploader.upload(profileImage.tempFilePath, {
        folder: 'user_profiles',
        resource_type: 'image',
      });
      user.profileImage = result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error (profile):', error);
      return res.status(500).json({ message: "Erreur lors du téléchargement de l'image de profil." });
    }
  }

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    nom: updatedUser.nom,
    prenom: updatedUser.prenom,
    email: updatedUser.email,
    role: updatedUser.role,
    specialite: updatedUser.specialite,
    profileImage: updatedUser.profileImage,
    ville: updatedUser.ville,
    localisation: updatedUser.localisation,
  });
});

exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
  }

  res.json({
    _id: user._id,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    specialite: user.specialite,
    profileImage: user.profileImage,
    ville: user.ville,
    localisation: user.localisation,
    validated: user.validated,
  });
});

exports.getSpecialites = asyncHandler(async (req, res) => {
  try {
    const specialites = await User.distinct('specialite');
    const specialitesList = [
      { value: '', label: 'Sélectionner une spécialité' },
      ...specialites
        .filter(specialite => specialite)
        .map(specialite => ({ value: specialite, label: specialite }))
    ];
    res.json(specialitesList);
  } catch (err) {
    console.error('Erreur lors de la récupération des spécialités:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des spécialités.' });
  }
});

exports.searchDoctorsByCity = asyncHandler(async (req, res) => {
  const { nom, specialite, ville } = req.query;
  console.log('searchDoctorsByCity - Requête reçue:', { nom, specialite, ville });

  if (!nom && !specialite && !ville) {
    return res.status(400).json({ message: 'Au moins un critère de recherche (nom, spécialité ou ville) est requis.' });
  }

  const query = {
    role: 'internaute',
    validated: true,
  };

  if (nom) {
    query.$or = [
      { nom: { $regex: nom, $options: 'i' } },
      { prenom: { $regex: nom, $options: 'i' } },
    ];
  }

  if (specialite) {
    query.specialite = { $regex: specialite, $options: 'i' };
  }

  if (ville) {
    query.ville = { $regex: ville, $options: 'i' };
  }

  try {
    const doctors = await User.find(query).select('nom prenom specialite ville localisation profileImage');
    console.log('searchDoctorsByCity - Résultat:', doctors);

    if (doctors.length === 0) {
      return res.json({
        message: `Aucun médecin trouvé pour les critères spécifiés.`,
        doctors: [],
      });
    }

    res.json(doctors);
  } catch (error) {
    console.error('searchDoctorsByCity - Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la recherche.' });
  }
});

exports.updateDoctorSchedule = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Utilisateur non authentifié.' });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Utilisateur non trouvé.' });
  }
  if (user.role !== 'internaute') {
    return res.status(403).json({ message: 'Seuls les médecins peuvent mettre à jour leurs horaires.' });
  }

  const { horaires } = req.body;
  if (!horaires || typeof horaires !== 'object') {
    return res.status(400).json({ message: 'Les horaires doivent être fournis sous forme d\'objet.' });
  }

  const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  for (const day of days) {
    if (horaires[day]) {
      const { ouverture, fermeture, ferme } = horaires[day];
      if (ferme === true) {
        horaires[day] = { ouverture: '', fermeture: '', ferme: true };
      } else {
        if (!ouverture || !fermeture || !/^\d{2}:\d{2}$/.test(ouverture) || !/^\d{2}:\d{2}$/.test(fermeture)) {
          return res.status(400).json({ message: `Format invalide pour les horaires du ${day}. Utilisez HH:MM.` });
        }
        horaires[day].ferme = false;
      }
    }
  }

  user.horaires = horaires;
  await user.save();

  res.json({ message: 'Horaires mis à jour avec succès.', horaires: user.horaires });
});

exports.getDoctorSchedule = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  console.log('Received request for doctorId:', doctorId);

  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    console.log('Invalid doctorId format:', doctorId);
    return res.status(400).json({ message: 'ID de médecin invalide.' });
  }

  console.log('Querying database for user with ID:', doctorId);
  const doctor = await User.findById(doctorId).select('horaires nom prenom specialite role');
  if (!doctor) {
    console.log('Doctor not found for ID:', doctorId);
    return res.status(404).json({ message: 'Médecin non trouvé.' });
  }

  console.log('Doctor found:', doctor);
  if (doctor.role !== 'internaute') {
    console.log('User is not a doctor. Role:', doctor.role);
    return res.status(404).json({ message: 'Médecin non trouvé.' });
  }

  console.log('Returning schedule for doctor:', doctorId);
  res.json({ horaires: doctor.horaires, doctor: { nom: doctor.nom, prenom: doctor.prenom, specialite: doctor.specialite } });
});

exports.getDoctorScheduleForPatient = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;
  console.log('Patient requesting schedule for doctorId:', doctorId, 'on date:', date);

  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    console.log('Invalid doctorId format:', doctorId);
    return res.status(400).json({ message: 'ID de médecin invalide.' });
  }

  console.log('Querying database for user with ID:', doctorId);
  const doctor = await User.findById(doctorId).select('horaires nom prenom specialite role');
  if (!doctor) {
    console.log('Doctor not found for ID:', doctorId);
    return res.status(404).json({ message: 'Médecin non trouvé.' });
  }

  console.log('Doctor found:', doctor);
  if (doctor.role !== 'internaute') {
    console.log('User is not a doctor. Role:', doctor.role);
    return res.status(404).json({ message: 'Médecin non trouvé.' });
  }

  if (!date) {
    console.log('No date provided, returning general schedule for doctor:', doctorId);
    return res.json({
      horaires: doctor.horaires,
      doctor: { nom: doctor.nom, prenom: doctor.prenom, specialite: doctor.specialite },
    });
  }

  const selectedDate = new Date(date);
  if (isNaN(selectedDate.getTime())) {
    return res.status(400).json({ message: 'Date invalide. Utilisez le format YYYY-MM-DD.' });
  }

  const now = new Date();
  if (selectedDate < now) {
    return res.status(400).json({ message: 'Vous ne pouvez pas prendre de rendez-vous dans le passé.' });
  }

  const dayName = selectedDate.toLocaleString('fr-FR', { weekday: 'long' }).toLowerCase();
  const horaires = doctor.horaires[dayName];

  if (horaires.ferme) {
    return res.status(400).json({ message: `Le médecin est fermé le ${dayName}.` });
  }

  const [openHour, openMinute] = horaires.ouverture.split(':').map(Number);
  const [closeHour, closeMinute] = horaires.fermeture.split(':').map(Number);

  let startTime = openHour * 60 + openMinute;
  const endTime = closeHour * 60 + closeMinute;
  const interval = 30;
  let availableSlots = [];

  if (selectedDate.toDateString() === now.toDateString()) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    startTime = Math.max(startTime, currentTime + interval);
  }

  while (startTime + interval <= endTime) {
    const slotHour = Math.floor(startTime / 60);
    const slotMinute = startTime % 60;
    const slotTime = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
    availableSlots.push(slotTime);
    startTime += interval;
  }

  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointments = await Appointment.find({
    doctorId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['confirmed', 'pending'] },
  });

  const bookedSlots = existingAppointments.map((appointment) => {
    const date = new Date(appointment.date);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  });

  availableSlots = availableSlots.filter((slot) => !bookedSlots.includes(slot));

  res.json({
    horaires: doctor.horaires,
    doctor: { nom: doctor.nom, prenom: doctor.prenom, specialite: doctor.specialite },
    availableSlots,
    selectedDate: selectedDate.toISOString().split('T')[0],
  });
});

exports.bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, date, time } = req.body;
  const patientId = req.user.id;

  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'internaute') {
    return res.status(404).json({ message: 'Médecin non trouvé.' });
  }

  const patient = await User.findById(patientId);
  if (!patient || patient.role !== 'patient') {
    return res.status(403).json({ message: 'Seuls les patients peuvent prendre des rendez-vous.' });
  }

  const [hours, minutes] = time.split(':').map(Number);
  const appointmentDate = new Date(date);
  appointmentDate.setHours(hours, minutes, 0, 0);

  const now = new Date();
  if (appointmentDate < now) {
    return res.status(400).json({ message: 'Vous ne pouvez pas prendre de rendez-vous dans le passé.' });
  }

  const dayName = appointmentDate.toLocaleString('fr-FR', { weekday: 'long' }).toLowerCase();
  const horaires = doctor.horaires[dayName];

  if (horaires.ferme) {
    return res.status(400).json({ message: `Le médecin est fermé le ${dayName}.` });
  }

  const [openHour, openMinute] = horaires.ouverture.split(':').map(Number);
  const [closeHour, closeMinute] = horaires.fermeture.split(':').map(Number);
  const appointmentHour = appointmentDate.getHours();
  const appointmentMinute = appointmentDate.getMinutes();

  const openTime = openHour * 60 + openMinute;
  const closeTime = closeHour * 60 + closeMinute;
  const appointmentTime = appointmentHour * 60 + appointmentMinute;

  if (appointmentTime < openTime || appointmentTime >= closeTime) {
    return res.status(400).json({ message: 'Le créneau horaire est en dehors des heures d\'ouverture.' });
  }

  const existingAppointment = await Appointment.findOne({
    doctorId,
    date: {
      $gte: new Date(appointmentDate.getTime() - 15 * 60 * 1000),
      $lte: new Date(appointmentDate.getTime() + 15 * 60 * 1000),
    },
    status: { $in: ['confirmed', 'pending'] },
  });

  if (existingAppointment) {
    return res.status(400).json({ message: 'Ce créneau est déjà pris.' });
  }

  const newAppointment = new Appointment({
    doctorId,
    patientId,
    date: appointmentDate,
    status: 'pending',
  });

  await newAppointment.save();

  res.status(201).json({ message: 'Rendez-vous pris avec succès.', appointment: newAppointment });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  console.log('Admin requesting all users');
  const users = await User.find().select('-password');
  console.log('Users found:', users);
  res.status(200).json(users);
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;

  console.log('Admin updating user:', { userId, updates });

  if (updates.password) {
    return res.status(400).json({ message: 'La modification du mot de passe n’est pas autorisée via cet endpoint.' });
  }

  if (updates.role === 'admin') {
    return res.status(403).json({ message: 'Impossible de créer un autre compte admin via cet endpoint.' });
  }

  const user = await User.findById(userId);
  if (!user) {
    console.log('User not found for ID:', userId);
    return res.status(404).json({ message: 'Utilisateur non trouvé.' });
  }

  Object.assign(user, updates);
  user.updatedAt = Date.now();
  await user.save();

  console.log('User updated:', user);
  res.status(200).json({ message: 'Utilisateur mis à jour avec succès.', user });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  console.log('Admin deleting user:', userId);

  const user = await User.findById(userId);
  if (!user) {
    console.log('User not found for ID:', userId);
    return res.status(404).json({ message: 'Utilisateur non trouvé.' });
  }

  if (user.role === 'admin') {
    return res.status(403).json({ message: 'Impossible de supprimer un compte admin.' });
  }

  await user.deleteOne();
  console.log('User deleted:', userId);
  res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
});

exports.validateDoctorLicense = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  console.log('Admin validating doctor license for userId:', userId);

  const user = await User.findById(userId);
  if (!user) {
    console.log('User not found for ID:', userId);
    return res.status(404).json({ message: 'Utilisateur non trouvé.' });
  }

  if (user.role !== 'internaute') {
    console.log('User is not a doctor. Role:', user.role);
    return res.status(400).json({ message: 'Cet utilisateur n’est pas un médecin.' });
  }

  user.validated = true;
  user.updatedAt = Date.now();
  await user.save();

  const doctorEmail = user.email;
  const doctorName = `${user.prenom} ${user.nom}`;
  const subject = 'Validation de votre compte médecin';
  const text = `Bonjour Dr. ${doctorName},\n\nVotre compte sur la plateforme Rdv-Med a été validé avec succès par l'administrateur.\nVous pouvez maintenant commencer à accepter des rendez-vous.\n\nCordialement,\nL'équipe de Rdv-Med`;
  const html = `
    <h2>Bonjour Dr. ${doctorName},</h2>
    <p>Votre compte sur la plateforme <strong>Rdv-Med</strong> a été validé avec succès par l'administrateur.</p>
    <p>Vous pouvez maintenant commencer à accepter des rendez-vous.</p>
    <p>Cordialement,<br>L'équipe de Rdv-Med</p>
  `;

  try {
    await sendEmail({
      to: doctorEmail,
      subject,
      text,
      html,
    });
    console.log(`Validation email sent to ${doctorEmail}`);
  } catch (error) {
    console.error(`Failed to send validation email to ${doctorEmail}:`, error);
  }

  console.log('Doctor license validated:', user);
  res.status(200).json({ message: 'Licence du médecin validée avec succès.', user });
});

exports.getDoctorsBySpecialty = asyncHandler(async (req, res) => {
  try {
    const specialties = await User.aggregate([
      {
        $match: {
          role: 'internaute',
          validated: true,
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$specialite', 'Non spécifiée'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    console.log('Doctors by specialty aggregation result:', specialties);

    const data = specialties.map((item) => ({
      name: item._id,
      value: item.count,
    }));

    res.json(data);
  } catch (error) {
    console.error('Error fetching doctors by specialty:', error.message, error.stack);
    res.status(500).json({ message: 'Erreur lors de la récupération des données.' });
  }
});

// Fonction pour demander une réinitialisation

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Fonction pour demander une réinitialisation
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet email." });
  }

  // Générer un token de réinitialisation (valide 10 minutes)
  const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '10m' });
  
  // Envoyer l'email
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const subject = 'Réinitialisation de votre mot de passe';
  const text = `Bonjour ${user.prenom},\n\nPour réinitialiser votre mot de passe, cliquez sur ce lien : ${resetUrl}\n\nCe lien expirera dans 10 minutes.\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.\n\nCordialement,\nL'équipe Rdv-Med`;
  const html = `
    <h2>Bonjour ${user.prenom},</h2>
    <p>Pour réinitialiser votre mot de passe, cliquez sur le lien ci-dessous :</p>
    <p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>
    <p><small>Ce lien expirera dans 10 minutes.</small></p>
    <p>Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.</p>
    <p>Cordialement,<br>L'équipe Rdv-Med</p>
  `;

  try {
    await sendEmail({ to: user.email, subject, text, html });
    res.json({ message: "Un email de réinitialisation a été envoyé." });
  } catch (error) {
    console.error('Error sending reset email:', error);
    return res.status(500).json({ message: "Erreur lors de l'envoi de l'email de réinitialisation." });
  }
});

// Fonction pour réinitialiser le mot de passe
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token et nouveau mot de passe requis." });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Trouver l'utilisateur
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error('Error resetting password:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: "Le lien de réinitialisation a expiré." });
    }
    return res.status(400).json({ message: "Token invalide." });
  }
});