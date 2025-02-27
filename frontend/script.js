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
    
    // Update the API URL to be environment-aware
    const API_URL = process.env.NODE_ENV === 'production'
        ? 'https://your-backend-url.herokuapp.com/generate-recipe'  // Replace with your deployed backend URL
        : 'http://localhost:3002/generate-recipe';
    
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
            
            if (! response.ok) {
                throw new Error('Failed to generate recipe');
            }
            
            const data = await response.json();
            
            // Process and display the recipe
            displayRecipe(data.recipe, ingredients);
            
            // Save to recent searches
            saveSearch(ingredients);
            
        } catch (error) {
            showError(error.message || 'Something went wrong. Please try again.');
        } finally {
            loader.style.display = 'none';
        }
    }
    
    // Display Recipe Function
    function displayRecipe(recipe, ingredients) {
        // Generate a title based on ingredients if not provided in the recipe
        const mainIngredients = ingredients.split(',')[0].trim();
        const title = recipe.title || `${mainIngredients.charAt(0).toUpperCase() + mainIngredients.slice(1)} Recipe`;
        
        // Set the title
        recipeTitle.textContent = title;
        
        // Format the recipe content with styling
        recipeContent.innerHTML = formatRecipe(recipe);
        
        // Show the recipe section with animation
        recipeSection.style.display = 'block';
        recipeSection.classList.add('fade-in');
    }
    
    // Format Recipe Content
    function formatRecipe(recipe) {
        // If recipe is already formatted in HTML, return as is
        if (typeof recipe === 'string') {
            return recipe;
        }
        
        // Otherwise, format the recipe object
        let content = '';
        
        if (recipe.description) {
            content += `<p>${recipe.description}</p>`;
        }
        
        if (recipe.ingredients && recipe.ingredients.length) {
            content += '<h3>Ingredients</h3><ul>';
            recipe.ingredients.forEach(ingredient => {
                content += `<li>${ingredient}</li>`;
            });
            content += '</ul>';
        }
        
        if (recipe.instructions && recipe.instructions.length) {
            content += '<h3>Instructions</h3><ol>';
            recipe.instructions.forEach(step => {
                content += `<li>${step}</li>`;
            });
            content += '</ol>';
        }
        
        if (recipe.tips) {
            content += `<h3>Tips</h3><p>${recipe.tips}</p>`;
        }
        
        // If recipe is just a string but the parser couldn't detect structure
        if (!content && recipe.text) {
            content = `<p>${recipe.text}</p>`;
        }
        
        return content;
    }
    
    // Copy Recipe Function
    function copyRecipe() {
        const title = recipeTitle.textContent;
        const content = recipeContent.innerText;
        const fullRecipe = `${title}\n\n${content}`;
        
        navigator.clipboard.writeText(fullRecipe)
            .then(() => {
                // Visual feedback that copying worked
                copyBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                `;
                copyBtn.style.color = '#4CAF50';
                
                // Reset after 2 seconds
                setTimeout(() => {
                    copyBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    `;
                    copyBtn.style.color = '#666';
                }, 2000);
            })
            .catch(err => {
                showError('Failed to copy recipe');
            });
    }
    
    // Show Error Function
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        errorMessage.classList.add('fade-in');
    }
    
    // Save Search to Local Storage
    function saveSearch(ingredients) {
        // Don't add duplicates
        if (!searches.includes(ingredients)) {
            // Add to the beginning of the array
            searches.unshift(ingredients);
            
            // Limit to 5 recent searches
            if (searches.length > 5) {
                searches.pop();
            }
            
            // Save to local storage
            localStorage.setItem('recentSearches', JSON.stringify(searches));
            
            // Update the displayed list
            updateRecentSearches();
        }
    }
    
    // Update Recent Searches Display
    function updateRecentSearches() {
        // Clear the current list
        recentList.innerHTML = '';
        
        // Hide the section if there are no recent searches
        if (searches.length === 0) {
            recentSearches.style.display = 'none';
            return;
        }
        
        // Show the section
        recentSearches.style.display = 'block';
        
        // Add each search to the list
        searches.forEach(search => {
            const li = document.createElement('li');
            
            // Create search text element
            const searchText = document.createElement('span');
            searchText.textContent = search;
            searchText.style.cursor = 'pointer';
            searchText.addEventListener('click', () => {
                ingredientsInput.value = search;
                generateRecipe();
            });
            
            // Create use button
            const useBtn = document.createElement('button');
            useBtn.textContent = 'Use';
            useBtn.addEventListener('click', () => {
                ingredientsInput.value = search;
                generateRecipe();
            });
            
            // Append elements to list item
            li.appendChild(searchText);
            li.appendChild(useBtn);
            
            // Append to list
            recentList.appendChild(li);
        });
    }
});