import fs from 'fs-extra';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'character.html');
const OUTPUT_DIR = path.join(__dirname, '..', 'dist', 'characters');

async function fetchAllCharacters() {
    let allCharacters = [];
    let page = 1;
    let apiURL = `https://rickandmortyapi.com/api/character?page=${page}`;
    
    while (apiURL) {
        const response = await fetch(apiURL);
        const data = await response.json();
        allCharacters = allCharacters.concat(data.results);
        apiURL = data.info.next; 
    }

    return allCharacters;
}

async function loadTemplate() {
    return fs.readFile(TEMPLATE_PATH, 'utf8');
}

function renderTemplate(template, character) {
    return template
        .replace(/{{name}}/g, character.name)
        .replace(/{{image}}/g, character.image)
        .replace(/{{status}}/g, character.status)
        .replace(/{{species}}/g, character.species)
        .replace(/{{origin}}/g, character.origin.name);
}

async function generatePages() {
    console.log("Fetching ALL characters from Rick and Morty API...");
    const characters = await fetchAllCharacters();
    const template = await loadTemplate();

    await fs.remove(OUTPUT_DIR);
    await fs.ensureDir(OUTPUT_DIR);

    for (let i = 0; i < characters.length; i++) {
        const character = characters[i];
        const characterHTML = renderTemplate(template, character);
        const filePath = path.join(OUTPUT_DIR, `${character.id}.html`);
        await fs.writeFile(filePath, characterHTML);

        console.log(`Generated: ${filePath}`);
    }

    console.log('Static pages generated successfully!');
}

async function generateIndexPage() {
    console.log("Generating index.html...");
    const characters = await fetchAllCharacters();

    let perPage = 20;
    let totalPages = Math.ceil(characters.length / perPage);

    for (let page = 1; page <= totalPages; page++) {
        let start = (page - 1) * perPage;
        let end = start + perPage;
        let paginatedCharacters = characters.slice(start, end);

        let characterLinks = paginatedCharacters.map(character => 
            `<div class="character-card">
                <a href="characters/${character.id}.html">
                    <img src="${character.image}" alt="${character.name}">
                    <h3>${character.name}</h3>
                </a>
            </div>`
        ).join('');

        let pagination = `<div class="pagination">`;
        if (page > 1) {
            pagination += `<a href="index${page - 1}.html">« Previous</a>`;
        }
        if (page < totalPages) {
            pagination += `<a href="index${page + 1}.html">Next »</a>`;
        }
        pagination += `</div>`;

        let indexHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Rick and Morty Characters</title>
            <link rel="stylesheet" href="/styles/style.css">
        </head>
        <body>
            <h1>Rick and Morty Characters</h1>
            <div class="character-list">
                ${characterLinks}
            </div>
            ${pagination}
        </body>
        </html>
        `;

        let fileName = page === 1 ? "index.html" : `index${page}.html`;
        await fs.writeFile(path.join(__dirname, '..', 'dist', fileName), indexHTML);
        console.log(`Generated: dist/${fileName}`);
    }

    console.log('Index pages generated successfully!');
}

generatePages().then(generateIndexPage);
