# Football Finder

A web application that helps users find and join local football games in their area. Users can view nearby games on a map, create new games, and join existing games through WhatsApp groups.

## Features

- View nearby football games on an interactive map
- Create new games with location, date/time, and WhatsApp group link
- Get email notifications for new games in your area
- Join games through WhatsApp groups
- Filter games by distance and date

## Tech Stack

- Backend: Flask (Python)
- Frontend: React with Vite
- Database: PostgreSQL with PostGIS extension
- Map: Mapbox
- UI Framework: Chakra UI
- Email Notifications: Flask-Mail

## Setup

### Prerequisites

1. PostgreSQL with PostGIS extension
2. Python 3.8+
3. Node.js 14+
4. Mapbox API key

### Backend Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE football_finder;
\c football_finder;
CREATE EXTENSION postgis;
```

2. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Create a `.env` file in the backend directory:
```
DATABASE_URL=postgresql://localhost/football_finder
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-specific-password
```

4. Run the Flask server:
```bash
python app.py
```

### Frontend Setup

1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

2. Update the Mapbox token in `src/App.jsx`:
```javascript
const MAPBOX_TOKEN = 'your-mapbox-token';
```

3. Start the development server:
```bash
npm run dev
```

## Usage

1. Allow location access in your browser to see nearby games
2. Click on game markers to view details and join WhatsApp groups
3. Click "Create New Game" to add a new game
4. Set up email notifications by creating an account

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
