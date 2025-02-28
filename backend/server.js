const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;  // Change from 3000 to 3001

// Middleware
app.use(cors({
    origin: [
        'https://harishkumar59.github.io',
        'http://localhost:3000', 
        'http://127.0.0.1:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Add headers middleware
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'interest-cohort=()');
    next();
});

app.use(express.json());

// Hugging Face API configuration
const HF_API_URL = 'https://api-inference.huggingface.co/models/bigscience/bloomz-560m';
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;

// Add this check to verify the API key is loaded
if (!HF_API_KEY) {
    console.error('Warning: HUGGING_FACE_API_KEY is not set in .env file');
}

// API endpoint to generate recipes
app.post('/generate-recipe', async (req, res) => {
    try {
        const { ingredients } = req.body;
        
        // Input validation
        if (!ingredients || typeof ingredients !== 'string' || ingredients.trim() === '') {
            return res.status(400).json({ 
                error: 'Invalid input',
                message: 'Please provide ingredients as a comma-separated string'
            });
        }

        // API key validation
        if (!HF_API_KEY) {
            console.error('Hugging Face API key is missing');
            return res.status(500).json({ 
                error: 'Configuration Error',
                message: 'Server is not properly configured'
            });
        }

        // Generate recipe
        const prompt = createRecipePrompt(ingredients);
        const recipe = await generateRecipeFromHuggingFace(prompt);
        
        if (!recipe) {
            return res.status(500).json({ 
                error: 'Generation Failed',
                message: 'Failed to generate recipe from AI service'
            });
        }

        // Parse and return recipe
        const parsedRecipe = parseRecipeText(recipe, ingredients);
        res.json({ recipe: parsedRecipe });

    } catch (error) {
        console.error('Recipe generation error:', {
            message: error.message,
            stack: error.stack,
            ingredients: req.body?.ingredients
        });

        res.status(500).json({ 
            error: 'Server Error',
            message: 'Failed to generate recipe. Please try again.'
        });
    }
});

// Create recipe prompt based on ingredients
function createRecipePrompt(ingredients) {
    const ingredientsList = ingredients
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '')
        .join(', ');
    
    return `Create a detailed recipe using these ingredients: ${ingredientsList}.
Include a title, ingredients list, and step-by-step instructions.
Format the recipe with clear sections.`;
}

// Call Hugging Face API to generate recipe
async function generateRecipeFromHuggingFace(prompt) {
    try {
        console.log('Calling Hugging Face API with prompt:', prompt);
        
        const response = await axios.post(
            HF_API_URL,
            { inputs: prompt },
            {
                headers: {
                    'Authorization': `Bearer ${HF_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('Hugging Face API response:', response.data);
        return response.data[0].generated_text;
        
    } catch (error) {
        console.error('Hugging Face API error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        throw new Error(`Hugging Face API error: ${error.message}`);
    }
}

// Parse the generated text into a structured recipe
function parseRecipeText(text, rawIngredients) {
    // Try to extract structured data from the text
    try {
        // Extract the title
        let title = '';
        const titleMatch = text.match(/^(.+?)\n/) || text.match(/^# (.+)$/) || text.match(/^(.+?):/);
        if (titleMatch) {
            title = titleMatch[1].trim();
        } else {
            // Generate a title from the main ingredient
            const mainIngredient = rawIngredients.split(',')[0].trim();
            title = `${mainIngredient.charAt(0).toUpperCase() + mainIngredient.slice(1)} Recipe`;
        }
        
        // Extract ingredients list
        let ingredients = [];
        const ingredientsSection = text.match(/ingredients:?\s*\n([\s\S]*?)(?:\n\s*\n|\n\s*instructions)/i);
        
        if (ingredientsSection) {
            ingredients = ingredientsSection[1]
                .split('\n')
                .map(item => item.replace(/^-\s*|\d+\.\s*|\*/g, '').trim())
                .filter(item => item !== '');
        } else {
            // Fallback to the provided ingredients
            ingredients = rawIngredients
                .split(',')
                .map(item => item.trim())
                .filter(item => item !== '');
        }
        
        // Extract instructions
        let instructions = [];
        const instructionsSection = text.match(/instructions:?\s*\n([\s\S]*?)(?:\n\s*\n|\n\s*$|$)/i);
        
        if (instructionsSection) {
            instructions = instructionsSection[1]
                .split('\n')
                .map(item => item.replace(/^-\s*|\d+\.\s*|\*/g, '').trim())
                .filter(item => item !== '');
        }
        
        // Extract description if available
        let description = '';
        const descriptionSection = text.match(/description:?\s*\n([\s\S]*?)(?:\n\s*\n|\n\s*ingredients)/i);
        
        if (descriptionSection) {
            description = descriptionSection[1].trim();
        }
        
        // If we couldn't extract structured data, return the full text
        if (instructions.length === 0) {
            return {
                title,
                text: text
            };
        }
        
        // Return structured recipe
        return {
            title,
            ingredients,
            instructions,
            description
        };
        
    } catch (error) {
        // If parsing fails, return the raw text
        console.error('Error parsing recipe:', error);
        
        return {
            title: `Recipe with ${rawIngredients.split(',')[0].trim()}`,
            text: text
        };
    }
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('API Key status:', HF_API_KEY ? 'Present' : 'Missing');
}); 

