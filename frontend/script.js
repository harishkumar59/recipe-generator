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
        : 'https://recipe-generator-11cu.onrender.com/generate-recipe';
    
    // Load recent searches from local storage  
    let searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    updateRecentSearches();
    
    // Event Listeners
    generateBtn.addEventListener('click', generateRecipe);
    copyBtn.addEventListener('click', copyRecipe);
    
    // Generate Recipe Function
    async function generateRecipe() {
        const ingredients = ingredientsInput.value.trim();
        
        // Validate input
        if (!ingredients) {
            showError('Please enter at least one ingredient');
            return;
        }
        
        // Show loader, hide other sections
        loader.style.display = 'flex';
        recipeSection.style.display = 'none';
        errorMessage.style.display = 'none';
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ingredients })
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate recipe');
            }
            
            const data = await response.json();
            displayRecipe(data.recipe, ingredients);
            saveSearch(ingredients);
            
        } catch (error) {
            showError(error.message || 'Something went wrong. Please try again.');
        } finally {
            loader.style.display = 'none';
        }
    }
    
    // Rest of your functions remain the same...
}); 