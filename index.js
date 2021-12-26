const fs = require ('fs');
const {Client, MessageMedia} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const ExcelJs = require('exceljs')
const moment = require('moment');

//Save the Session Key
const SESSION_FILE_PATH = './session.json';

let client;
let sessionData;

//The method is called if there is already a guadada connection in session.json
const withSession = () =>{
    console.log('Loading session...')
    sessionData = require(SESSION_FILE_PATH);
    client = new Client({
        session: sessionData
    });

    client.on('ready', ()=>{
        console.log('Ready client');
        Menssage();
    });

    client.on('auth_failure', () =>{
        console.log('Authentication failed, try again');
    });

    client.initialize();
}


// Generates the Qr for the first time and creates a json file where the session will be saved
const withOutSession = () => {
    console.log('No hay sesion iniciada');
    client = new Client();
    client.on('qr', qr =>{
        qrcode.generate(qr, {small: true});
    });

    client.on('authenticated', (session) =>{
        sessionData = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function(err){
            if (err){
                console.log(err);
            }
        });
    });
    client.initialize();
}

//Sending messages. Departure by terminal: number and the message that was sent to us
const Menssage = () => {
    client.on('message', message => {
        const{from, to, body} = message;
        console.log(from, to, body);
        if(message.body === message.body) {
            client.sendMessage(message.from, 'Hello, At the moment I do not find myself, this is a Whatsapp bot. \n - If you want to see the link send 1. \n - If you want to see an image send 2. \n All messages are saved automatically!');
            switch (body) {
                case '1':
                    message.reply('Link https://github.com/XEnzoX');
                    break;
                case '2':
                    message.reply('Image')
                    sendMedia(from, 'img.png')
                    break;
                default:
                    message.reply('The number you entered was not found, or the option you want is not available. Please enter one of the options mentioned. Thanks')
                break;
            }
            saveChat(from, body);   
        }
        
    });
};


//Saves the chat to xlsx (excel) file in the docs folder
const saveChat = (number, message) => {
    const chat = `./docs/${number}.xlsx`;
    const workBook = new ExcelJs.Workbook();
    const today = moment().format('DD-MM-YYYY hh:mm');

    if (fs.existsSync(chat)){
    workBook.xlsx.readFile(chat)
        .then(()=>{
            const worksheet = workBook.getWorksheet(1);
            const lastRow = worksheet.lastRow;
            let getRowInsert = worksheet.getRow(++(lastRow.number));
            getRowInsert.getCell('A').value = today;
            getRowInsert.getCell('B').value = message;
            getRowInsert.commit();
            workBook.xlsx.writeFile(chat)
            .then(()=> {
                console.log('Chat saved')
            })
            .catch(()=>{
                console.log('An error occurred while saving the caht')
            })
        })
    }else{
       const worksheet = workBook.addWorksheet('Chats');
       worksheet.columns = [
           {header: 'Fecha', key: 'date'},
           {header: 'Mensaje', key: 'message'}
       ]
       worksheet.addRow([today, message])
       workBook.xlsx.writeFile(chat)
       .then(()=>{
           console.log('History created');
       })
       .catch(()=>{
           console.log('There was a failure');
       })
    }
}

//Send File
const sendMedia = (to, file) => {
    const mediaFile = MessageMedia.fromFilePath(`./archive/${file}`)
    client.sendMessage(to, mediaFile) 
}



//It is evaluated if there is a session saved, otherwise a session has not been found, it will return the qr code to scan
(fs.existsSync(SESSION_FILE_PATH)) ? withSession() : withOutSession();