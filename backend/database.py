# backend/database.py
import mysql.connector
from mysql.connector import Error, pooling
from app_config import Config  
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Database:
    """Database connection manager"""
    
    _connection_pool = None
    
    @classmethod
    def initialize_pool(cls):
        """Initialize database connection pool"""
        try:
            cls._connection_pool = pooling.MySQLConnectionPool(
                pool_name="dr3_pool",
                pool_size=5,
                pool_reset_session=True,
                host=Config.DB_HOST,
                port=Config.DB_PORT,
                database=Config.DB_NAME,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD
            )
            logger.info("✅ Database connection pool initialized")
        except Error as e:
            logger.error(f"❌ Database connection error: {e}")
            logger.error(f"Host: {Config.DB_HOST}, Port: {Config.DB_PORT}")
            logger.error(f"Database: {Config.DB_NAME}, User: {Config.DB_USER}")
            raise
    
    @classmethod
    def get_connection(cls):
        """Get a connection from the pool"""
        if cls._connection_pool is None:
            cls.initialize_pool()
        
        try:
            connection = cls._connection_pool.get_connection()
            return connection
        except Error as e:
            logger.error(f"Error getting connection: {e}")
            raise
    
    @staticmethod
    def execute_query(query, params=None, fetch=False):
        """Execute a database query"""
        connection = None
        cursor = None
        
        try:
            connection = Database.get_connection()
            cursor = connection.cursor(dictionary=True)
            
            cursor.execute(query, params or ())
            
            if fetch:
                result = cursor.fetchall()
                return result
            else:
                connection.commit()
                return cursor.lastrowid
                
        except Error as e:
            if connection:
                connection.rollback()
            logger.error(f"Database query error: {e}")
            raise
            
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()