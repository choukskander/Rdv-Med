# 🏥 Plateforme de Prise de Rendez-vous Médicaux avec Chatbot et Diagnostic IA

**Un projet full-stack MERN & Python visant à transformer l’accès aux soins en Tunisie.**

> Dépôt GitHub : [Rdv-Med](https://github.com/choukskander/Rdv-Med.git)

---

## 🧠 Résumé du Projet

Cette plateforme vise à faciliter l’accès aux soins grâce à :
- Un **système centralisé de prise de rendez-vous médicaux**.
- Un **chatbot médical intelligent** capable d’analyser les symptômes.
- Un **module IA** pour la prédiction de maladies basé sur des jeux de données médicaux.
- Une **interface fluide et sécurisée** pour les patients et les professionnels de santé.

---

## 🎯 Objectifs Clés

- 🔽 Réduction du délai de prise de rendez-vous.
- 💬 Diagnostic préliminaire automatisé via IA.
- 🗂️ Accès centralisé à un annuaire de médecins certifiés.
- 🔐 Sécurité des données conforme au RGPD.

---

## 🧩 Fonctionnalités Principales

### 1. Gestion de Rendez-vous
- Recherche avancée de médecins par spécialité et localisation (Leaflet).
- Calendrier interactif et notifications.
- Système de rappels via email (Nodemailer).

### 2. Annuaire Médical
- Profils vérifiés, avis patients.
- Créneaux de consultation configurables par les professionnels.

### 3. Chatbot & IA Médicale
- Analyse de texte libre en français/arabe dialectal.
- Prédiction de maladies (modèles IA intégrés).
- Recommandations et alertes en cas de symptômes graves.

### 4. Tableau de Bord Patient
- Visualisation de l’historique médical.
- Graphiques évolutifs des symptômes (Chart.js).

### 5. Visioconférences Médicales
- Intégration de la Jitsi Meet API pour les consultations à distance.

---

## 🧱 Architecture

- **Frontend** (branche `Client`, dossier `rdv-app`)  
  ⚙️ Technologies : React.js, Chart.js, Leaflet, Jitsi Meet API

- **Backend** (branche `Server`)  
  ⚙️ Technologies : Node.js, Express.js, MongoDB, Nodemailer

---

## 🚀 Installation Locale

### 1. Cloner le projet
```bash
git clone https://github.com/choukskander/Rdv-Med.git

### 2. Installer et lancer le Backend
cd NodeJS
npm install
npm run dev
### 3. Installer et lancer le Frontend
cd rdv-app
npm install
npm start
