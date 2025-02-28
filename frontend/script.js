document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const ingredientsInput = document.getElementById('ingredients-input');
    const generateBtn = document.getElementById('generate-btn');
    const recipeSection = document.getElementById('recipe-section');
    const recipeContent = document.getElementById('recipe-content');
    const recipeTitle = document.getElementById('recipe-title');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const copyBtn = document.getElementById('copy-btn');
    const recentList = document.getElementById('recent-list');
    const recentSearches = document.getElementById('recent-searches');
    
    // Update API URL based on the current domain
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3002/generate-recipe'
        : 'https://recipe-generator-11cu.onrender.com/generate-recipe';  // Your deployed backend URL

    // Rest of your code remains the same...
}); 