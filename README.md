# Application Gestion BDC

Une application full-stack pour la gestion des données de "bon de commande" avec frontend React et backend Spring Boot, conteneurisée avec Docker Compose et connectée à une base de données MySQL Aiven.

## ⚠️ Statut

**Cette application est actuellement incomplète**


## Prérequis

- **Node.js** 18+ (pour le frontend React)
- **Java** 17 (pour le backend Spring Boot)
- **Maven** (pour la gestion des dépendances Java)
- **Docker** et **Docker Compose**
- **Identifiants de base de données MySQL Aiven** (host, port, nom d'utilisateur, mot de passe)
- **Identifiants SMTP** (pour la fonctionnalité email)
- **Clé secrète JWT** (pour l'authentification)

## Installation

1. **Cloner le repository :**
   ```bash
   git clone <repository-url>
   cd App
   ```

2. **Créer la configuration d'environnement :**
   ```bash
   # IMPORTANT : Créez votre propre fichier .env dans le dossier gestion_bc à partir de .env.example
   # Vous devez créer ce fichier avec vos propres valeurs de configuration
   cp gestion_bc/.env.example gestion_bc/.env
   ```
   
   **IMPORTANT :** Remplacez les valeurs placeholder dans `gestion_bc/.env.example` par votre configuration réelle
   
   **IMPORTANT :** Les tables `services` et `sites` de la base de données doivent être peuplées manuellement avec des données SQL avant de pouvoir utiliser l'application.

3. **Installer les dépendances :**
   ```bash
   # Dépendances frontend
   cd frontend_bc
   npm install
   cd ..
   
   # Dépendances backend (Maven s'en chargera via Docker)
   # Aucune installation manuelle nécessaire
   ```

## Lancement de l'Application

**Démarrer toute l'application avec Docker Compose :**
```bash
docker-compose up --build
```

**Accéder à l'application :**
- Frontend : http://localhost:5173
- API Backend : http://localhost:9090



### Authentification :
La plupart des points de terminaison nécessitent une authentification JWT. Incluez le token dans l'en-tête Authorization :
```
Authorization: Bearer <votre-jwt-token>
```

## Problèmes Connus


### Connexion Base de Données :
- L'application échouera au démarrage si le fichier `.env` est manquant ou mal configuré
- Les identifiants de base de données Aiven doivent être valides et accessibles



## Dépannage

### Problèmes Courants :

1. **Échec de Connexion à la Base de Données :**
   - Vérifiez les identifiants de base de données Aiven dans `.env`
   - Assurez-vous que la base de données est accessible depuis votre réseau
   - Vérifiez si le service de base de données est en cours d'exécution

2. **Erreurs de Build Frontend :**
   - Exécutez `npm install` dans le répertoire `frontend_bc`
   - Corrigez les erreurs TypeScript avant la construction
   - Vérifiez les dépendances manquantes

3. **Erreur 500 du Serveur Interne :**
   - Vérifiez les logs backend dans le conteneur Docker
   - Vérifiez que les variables d'environnement sont correctement définies
   - Assurez-vous que tous les services requis sont en cours d'exécution

4. **Problèmes d'Authentification :**
   - Vérifiez que JWT_SECRET est défini dans `.env`
   - Vérifiez si les identifiants utilisateur sont valides
   - Assurez-vous que le token est envoyé dans les requêtes


## Contact

Pour des questions ou des problèmes liés à ce projet, veuillez me contacter par email. Le support sera disponible pendant une semaine après la remise.

---

**Note :** Cette application est en développement et peut nécessiter un travail important pour devenir prête pour la production. Examinez tout le code et les configurations avant le déploiement.
