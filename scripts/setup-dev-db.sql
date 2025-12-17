-- Setup script for development database
-- Run this script to create the development database if it doesn't exist

-- Create development database
CREATE DATABASE zyx_development;

-- Connect to development database
\c zyx_development;

-- Note: Migrations will create the schema
-- This script just ensures the database exists
