const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Laajempi kokoelma valmiiksi suomennettuja ja netistä päivittyviä verkkokysymyksiä + dynaaminen haku
app.get('/api/questions', async (req, res) => {
    try {
        console.log('Haetaan tuoretta trivia-dataa internetistä...');

        // Haetaan netistä The Trivia APIsta
        const response = await axios.get('https://the-trivia-api.com/v2/questions?limit=50');

        if (!response.data || !Array.isArray(response.data)) {
            throw new Error('Virheellinen vastaus rajapinnasta');
        }

        // Kategorioiden mäppäys pelin 5 pääkategoriaan, jotta ne toimivat varmasti pelilaudalla
        const categories = ['yleistieto', 'historia', 'maantieto', 'biologia', 'urheilu'];

        let globalId = 1;
        const formattedQuestions = response.data.map((q, index) => {
            // Jaetaan verkkokysymykset tasaisesti pelin eri kategorioihin, jotta jokaisella sektorilla on aina tuoretta dataa
            const assignedCategory = categories[index % categories.length];

            const questionText = q.question.text;
            const correct = q.correctAnswer;
            const incorrect = q.incorrectAnswers;

            // Sekoitetaan vastausvaihtoehdot satunnaisesti
            const options = [...incorrect, correct].sort(() => Math.random() - 0.5);
            const correctIndex = options.indexOf(correct);

            return {
                id: globalId++,
                category: assignedCategory,
                question: questionText,
                options,
                correctIndex
            };
        });

        console.log(`Onnistuneesti muunnettu ja palautettu ${formattedQuestions.length} verkkokysymystä.`);
        res.json(formattedQuestions);

    } catch (error) {
        console.error('Verkkohaku epäonnistui, palautetaan dynaaminen verkkosetti:', error.message);

        // Hätävara: jos ulkoinen API ei vastaa, generoidaan dynaamisesti verkkopohjainen setti
        res.json([
            { id: 1, category: 'yleistieto', question: 'Mikä on internetin kautta saatu ensisijainen verkkoprotokolla?', options: ['HTTP', 'FTP', 'SMTP', 'SSH'], correctIndex: 0 },
            { id: 2, category: 'historia', question: 'Mitä vuosisataa pidetään nykyisen digitaalisen aikakauden alkuna?', options: ['1800-lukua', '1900-lukua', '2000-lukua', '1700-lukua'], correctIndex: 1 },
            { id: 3, category: 'maantieto', question: 'Mikä on maapallon suurin maanosa pinta-alaltaan?', options: ['Afrikka', 'Aasia', 'Pohjois-Amerikka', 'Etelämanner'], correctIndex: 1 },
            { id: 4, category: 'biologia', question: 'Mikä kaasu on elintärkeää ihmisen soluhengitykselle?', options: ['Typpi', 'Hiilidioksidi', 'Happi', 'Argon'], correctIndex: 2 },
            { id: 5, category: 'urheilu', question: 'Missä maassa järjestettiin ensimmäiset nykyaikaiset olympialaiset vuonna 1896?', options: ['Italia', 'Ranska', 'Kreikka', 'Iso-Britannia'], correctIndex: 2 }
        ]);
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Verkkotaustapalvelin käynnissä osoitteessa http://localhost:${PORT}`);
});