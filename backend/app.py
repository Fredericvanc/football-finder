import os
import jwt
import logging
import traceback
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from logging.handlers import RotatingFileHandler

# Configure logging
logging.basicConfig(level=logging.DEBUG)
handler = RotatingFileHandler('app.log', maxBytes=10000, backupCount=1)
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)

app = Flask(__name__)
app.logger.addHandler(handler)

# Configure CORS - Allow all methods and headers from frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:postgres@localhost/football_finder'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')

db = SQLAlchemy(app)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    games = db.relationship('Game', backref='creator', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Game(db.Model):
    __tablename__ = 'games'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.String(200), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    max_players = db.Column(db.Integer, nullable=False)
    skill_level = db.Column(db.String(50))
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

def generate_token(user_id):
    try:
        payload = {
            'exp': datetime.utcnow() + timedelta(days=1),
            'iat': datetime.utcnow(),
            'sub': user_id
        }
        return jwt.encode(
            payload,
            app.config.get('SECRET_KEY'),
            algorithm='HS256'
        )
    except Exception as e:
        app.logger.error(f"Token generation error: {str(e)}")
        return None

def get_user_from_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    try:
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return User.query.get(payload['sub'])
    except:
        return None

@app.route('/api/auth/register', methods=['POST'])
def register():
    app.logger.info("Registration attempt received")
    try:
        data = request.get_json()
        app.logger.debug(f"Registration data received: {data}")
        
        if not data:
            app.logger.error("No data received in registration request")
            return jsonify({'error': 'No data provided'}), 400
            
        # Validate required fields
        if not data.get('email'):
            return jsonify({'error': 'Email is required'}), 400
        if not data.get('password'):
            return jsonify({'error': 'Password is required'}), 400
            
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            app.logger.warning(f"Registration attempted with existing email: {data['email']}")
            return jsonify({'error': 'Email already registered'}), 400

        # Create new user
        user = User(
            email=data['email'],
            name=data.get('name', '')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Generate token
        token = generate_token(user.id)
        if not token:
            app.logger.error("Failed to generate token for new user")
            return jsonify({'error': 'Token generation failed'}), 500
            
        app.logger.info(f"User registered successfully: {user.email}")
        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            }
        }), 201
        
    except Exception as e:
        app.logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    app.logger.info("Login attempt received")
    try:
        data = request.get_json()
        app.logger.debug(f"Login data received: {data}")
        
        if not data:
            app.logger.error("No data received in login request")
            return jsonify({'error': 'No data provided'}), 400
            
        # Validate required fields
        if not data.get('email'):
            return jsonify({'error': 'Email is required'}), 400
        if not data.get('password'):
            return jsonify({'error': 'Password is required'}), 400
            
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            app.logger.warning(f"Failed login attempt for email: {data['email']}")
            return jsonify({'error': 'Invalid email or password'}), 401
            
        token = generate_token(user.id)
        if not token:
            app.logger.error("Failed to generate token for login")
            return jsonify({'error': 'Token generation failed'}), 500
            
        app.logger.info(f"User logged in successfully: {user.email}")
        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            }
        })
        
    except Exception as e:
        app.logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    app.logger.info("Get current user request received")
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
            
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, app.config.get('SECRET_KEY'), algorithms=['HS256'])
            user = User.query.get(payload['sub'])
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
                
            return jsonify({
                'id': user.id,
                'email': user.email,
                'name': user.name
            })
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
            
    except Exception as e:
        app.logger.error(f"Get current user error: {str(e)}")
        return jsonify({'error': 'Failed to get current user'}), 500

@app.route('/api/games', methods=['GET'])
def get_games():
    try:
        games = Game.query.order_by(Game.date.desc()).all()
        return jsonify([{
            'id': game.id,
            'title': game.title,
            'description': game.description,
            'location': game.location,
            'latitude': game.latitude,
            'longitude': game.longitude,
            'date': game.date.isoformat(),
            'max_players': game.max_players,
            'skill_level': game.skill_level,
            'creator': {
                'id': game.creator.id,
                'name': game.creator.name
            }
        } for game in games])
    except Exception as e:
        app.logger.error(f"Error getting games: {str(e)}")
        return jsonify({'error': 'Failed to get games'}), 500

@app.route('/api/games', methods=['POST'])
def create_game():
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required_fields = ['title', 'location', 'latitude', 'longitude', 'date', 'max_players']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        game = Game(
            title=data['title'],
            description=data.get('description', ''),
            location=data['location'],
            latitude=data['latitude'],
            longitude=data['longitude'],
            date=datetime.fromisoformat(data['date'].replace('Z', '+00:00')),
            max_players=data['max_players'],
            skill_level=data.get('skill_level', 'All levels'),
            creator_id=user.id
        )

        db.session.add(game)
        db.session.commit()

        return jsonify({
            'id': game.id,
            'title': game.title,
            'description': game.description,
            'location': game.location,
            'latitude': game.latitude,
            'longitude': game.longitude,
            'date': game.date.isoformat(),
            'max_players': game.max_players,
            'skill_level': game.skill_level,
            'creator': {
                'id': user.id,
                'name': user.name
            }
        }), 201

    except Exception as e:
        app.logger.error(f"Error creating game: {str(e)}")
        return jsonify({'error': 'Failed to create game'}), 500

if __name__ == '__main__':
    with app.app_context():
        try:
            app.logger.info("Creating tables if they don't exist...")
            db.create_all()
            app.logger.info("Database tables ready!")
        except Exception as e:
            app.logger.error(f"Error setting up database: {str(e)}")
            app.logger.error(traceback.format_exc())
    app.run(port=5001, debug=True)
