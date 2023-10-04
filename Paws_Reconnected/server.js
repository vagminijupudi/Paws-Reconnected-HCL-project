require("dotenv").config();
const { IgApiClient } = require('instagram-private-api');
const { get } = require('request-promise');
const fs2 = require('fs');
const { readFile} = require('fs') 
const csv = require('csv-parser');
const { promisify } = require('util')
const readFileAsync = promisify(readFile);
var caption1;
let image1;
var imager;


const csvFilePath = 'petData.csv';


const postToInsta = async () => {
    try {
        function readLastEntryFromCSV(csvFilePath, callback) {
            const data = [];
        
            fs2.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (row) => {
                    
                    data.push(row);
                })
                .on('end', () => {
                    const lastEntry = data[data.length - 1];
                    callback(null, lastEntry);
                })
                .on('error', (error) => {
                    callback(error, null);
                });
        }
        
        readLastEntryFromCSV(csvFilePath, (error, lastEntry) => {
            if (error) {
                console.error('Error reading CSV:', error);
            } else {
                // Access the data fields (e.g., name, category, etc.) from the last entry
                const name = lastEntry.Name;
                const category = lastEntry.Type;
                const description = lastEntry.Description;
                const status = lastEntry.Status;
                const imageUrl = lastEntry.Image;
                imager=imageUrl;
                image1=`./public${imageUrl}`;
                console.log('Name:', name);
                console.log('Category:', category);
                console.log('Description:', description);
                console.log('Status:', status);
                console.log('Image URL:', imageUrl);
                caption1 = ` 
                             Name:${name} 
                             Category: ${category} 
                             Description: ${description} 
                             Status:${status} `;
            }
            
        });
        const ig = new IgApiClient();
        ig.state.generateDevice(process.env.IG_USERNAME);
        await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
        const imageBuffer = await get({
                url: 'https://images.pexels.com/photos/1643457/pexels-photo-1643457.jpeg?auto=compress&cs=tinysrgb&w=600',
                encoding: null, 
            });
       
        await ig.publish.photo({
            file:await readFileAsync(image1),
            caption: caption1,
        });

        console.log('Posted to Instagram successfully.');
    } catch (error) {
        console.error('Error posting to Instagram:', error);
    }
};

module.exports = postToInsta;
