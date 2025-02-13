const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pathModule = require('path');

const OUTPUT_DIR = pathModule.join(__dirname, 'dist');

function sanitizeFilename(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-'); 
}

async function fetchAllCharacters() {
    let allCharacters = [];
    let page = 1;
    let nextPage = `https://rickandmortyapi.com/api/character?page=${page}`;

    while (nextPage) {
        const response = await axios.get(nextPage);
        allCharacters = allCharacters.concat(response.data.results);
        nextPage = response.data.info.next; 
    }

    return allCharacters;
}

async function generatePages() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const characters = await fetchAllCharacters(); 

    let indexContent = `<h1>Rick and Morty Characters</h1><ul>`;
    
    characters.forEach((character, index) => {
        const filename = sanitizeFilename(character.name) + '.html';
        indexContent += `<li><a href="${filename}">${character.name}</a></li>`;

        // "Next" and "Previous" logic
        const prevCharacter = index > 0 ? sanitizeFilename(characters[index - 1].name) + '.html' : null;
        const nextCharacter = index < characters.length - 1 ? sanitizeFilename(characters[index + 1].name) + '.html' : null;

        let navigation = `<div>`;
        if (prevCharacter) {
            navigation += `<a href="${prevCharacter}">« Previous</a> `;
        }
        if (nextCharacter) {
            navigation += `<a href="${nextCharacter}">Next »</a>`;
        }
        navigation += `</div>`;

        const characterPage = `
        <h1>${character.name}</h1>
        <img src="${character.image}" alt="${character.name}">
        <p>Status: ${character.status}</p>
        <p>Species: ${character.species}</p>
        ${navigation}
        <br>
        <a href="index.html">Back to list</a>
        `;

        fs.writeFileSync(pathModule.join(OUTPUT_DIR, filename), characterPage);
    });

    indexContent += `</ul>`;
    fs.writeFileSync(pathModule.join(OUTPUT_DIR, 'index.html'), indexContent);

    console.log(`Static site successfully generated with ${characters.length} characters in /dist`);
}

generatePages();
