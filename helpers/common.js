require('dotenv').config();
const path = require('path');
const ejs = require('ejs');
const nodemailer = require('nodemailer');
const axios = require("axios");
const DOMAIN_WEBSITE = process.env.DOMAIN_WEBSITE;
const SHORT_NAME_WEBSITE = process.env.SHORT_NAME_WEBSITE;
const FormData = require('form-data');
const fs = require('fs');

const generateRandomString = (length = 16) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }

    return result;
}
const generateRandomNumber = (length = 16) => {
    const characters = '0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }

    return result;
}



// const sendMessageToTelegramGroup = async (chatId, message, useProxy = false) => {
//     const bot = createTelegramBot(useProxy);
//
//     try {
//         await bot.sendMessage(chatId, message);
//         console.log('Message sent to Telegram group:', message);
//     } catch (error) {
//         console.error('Error sending message to Telegram group:', error);
//     }
// };
// const sendMessageWithImagesToTelegramGroup = async (chatId, message, imageFiles, useProxy = false) => {
//     const bot = createTelegramBot(useProxy);
//
//     try {
//         const media = imageFiles.map((imageFile, index) => {
//             const fileBuffer = Buffer.from(imageFile.data);
//             return {
//                 type: 'photo',
//                 media: fileBuffer,
//                 caption: index === 0 ? message : '',
//                 parse_mode: 'HTML'
//             };
//         });
//
//         await bot.sendMediaGroup(chatId, media);
//         console.log('Tin nhắn đã được gửi đến telegram thành công', message);
//     } catch (error) {
//         await sendMessageToTelegramGroup(chatId, message, useProxy);
//         console.error('Error sending message and images to Telegram group:', error);
//     }
// };

const tryToSendMessageToTelegramGroup = async (chatId, message, useProxy = false) => {
    const telegramApiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    const requestConfig = {
        params: {
            chat_id: chatId,
            text: message
        }
    };
    let proxyConfig = {}
    if (useProxy) {
        proxyConfig = {
            protocol: process.env.PROXY_PROTOCOL || 'http',
            host: process.env.PROXY_HOST,
            port: process.env.PROXY_PORT,
            auth:{
                username: process.env.PROXY_USERNAME,
                password: process.env.PROXY_PASSWORD
            }
        };
        requestConfig.proxy = proxyConfig
    }

    try {
        const response = await axios.post(telegramApiUrl, null, requestConfig);
        console.log('Message sent to Telegram group:', message);
    } catch (error) {
        console.error('Error sending message to Telegram group:');
        if(error.response){
            console.log(error.response.data)
        }
    }
};
const sendMessageToTelegramGroup = async (chatId, message, useProxy = false) => {
    const cloudflareWorkerUrl = process.env.CLOUDFLARE_API_URL;
    const requestConfig = {}
    const requestData = {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId,
        message
    }


    let proxyConfig = {};
    if (useProxy) {
        proxyConfig = {
            protocol: process.env.PROXY_PROTOCOL || 'http',
            host: process.env.PROXY_HOST,
            port: process.env.PROXY_PORT,
            auth: {
                username: process.env.PROXY_USERNAME,
                password: process.env.PROXY_PASSWORD
            }
        };
        requestConfig.proxy = proxyConfig;
    }

    try {
        const response = await axios.post(cloudflareWorkerUrl, requestData,requestConfig);
        console.log('Message sent to Cloudflare Worker:', message);
    } catch (error) {
        console.error('Error sending message to Cloudflare Worker:');
        if (error.response) {
            console.log(error.response.data);
        }
        await tryToSendMessageToTelegramGroup(chatId, message, useProxy);
    }
};

const sendMessageWithImagesToTelegramGroup = async (chatId, message, imageUrls, useProxy = false) => {
    const cloudflareWorkerUrl = process.env.CLOUDFLARE_API_URL;

    try {


        const requestData = {
            botToken: process.env.TELEGRAM_BOT_TOKEN,
            chatId: chatId,
            message: message,
            image_urls: imageUrls
        };

        const requestConfig = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (useProxy) {
            const proxyConfig = {
                protocol: process.env.PROXY_PROTOCOL || 'http',
                host: process.env.PROXY_HOST,
                port: process.env.PROXY_PORT,
                auth: {
                    username: process.env.PROXY_USERNAME,
                    password: process.env.PROXY_PASSWORD
                }
            };
            requestConfig.proxy = proxyConfig;
        }

        const response = await axios.post(cloudflareWorkerUrl, requestData, requestConfig);
        console.log('Tin nhắn đã được gửi đến Cloudflare Worker thành công', message);
    } catch (error) {
        await sendMessageToTelegramGroup(chatId, message, useProxy);
        console.error('Error sending message and images to Cloudflare Worker:', error);
    }
};

const sendEmail = async (to, subject, templateName, context) => {
    // Render the EJS template
    const templatePath = path.join(__dirname, '../views', `${templateName}.ejs`);
    const html = await ejs.renderFile(templatePath, { DOMAIN_WEBSITE, ...context });

    // Email options (without 'from' field for now)
    const mailOptions = {
        to: to, // List of receivers
        subject: subject, // Subject line
        html: html // Rendered HTML body
    };

    // Try sending with Namecheap first
    try {
        const namecheapTransporter = nodemailer.createTransport({
            host: 'mail.privateemail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.NAMECHEAP_EMAIL_USER,
                pass: process.env.NAMECHEAP_EMAIL_PASS
            }
        });

        // Set 'from' for Namecheap
        mailOptions.from = SHORT_NAME_WEBSITE
            ? `"${SHORT_NAME_WEBSITE}" <${process.env.NAMECHEAP_EMAIL_USER}>`
            : process.env.NAMECHEAP_EMAIL_USER;

        const info = await namecheapTransporter.sendMail(mailOptions);
        console.log('Email sent via Namecheap: ' + info.response);
        return info;
    } catch (namecheapError) {
        console.error('Error sending email via Namecheap:', namecheapError);

        // If Namecheap fails, try sending with Gmail
        try {
            const gmailTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_PASS
                }
            });

            // Set 'from' for Gmail
            mailOptions.from = SHORT_NAME_WEBSITE
                ? `"${SHORT_NAME_WEBSITE}" <${process.env.GMAIL_USER}>`
                : process.env.GMAIL_USER;

            const info = await gmailTransporter.sendMail(mailOptions);
            console.log('Email sent via Gmail: ' + info.response);
            return info;
        } catch (gmailError) {
            console.error('Error sending email via Gmail:', gmailError);
            throw new Error('Failed to send email via both Namecheap and Gmail');
        }
    }
};
const uploadFileAsyncToCloudflare = async (file, key) => {
    const apiKey = process.env.CLOUDFLARE_API_KEY;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const customId = `${process.env.CLOUDFLARE_FOLDER}-${generateRandomString(24)}`;
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;

    let url_key = key;
    if (!url_key) {
        const fileExtension = path.extname(file.name);
        url_key = `${generateRandomString(12)}${fileExtension}`;
    }

    const formData = new FormData();
    formData.append("file", file.data, {
        filename: url_key,
        contentType: file.mimetype,
    });
    formData.append("id", customId); // Thêm trường "id" với giá trị customId

    try {
        const response = await axios.post(uploadUrl, formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${apiKey}`,
            },
        });

        const { result } = response.data;
        return {
            ...result,
            Key: customId, // Sử dụng customId làm Key
        };
    } catch (error) {
        console.error("Error uploading file to Cloudflare:", error);
        throw error;
    }
};
const removeFilesFromCloudflare = async (keys) => {
    const apiKey = process.env.CLOUDFLARE_API_KEY;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const deleteUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;

    try {
        if (keys.length === 0) {
            return;
        }

        const promises = keys.map((key) => {
            return axios.delete(`${deleteUrl}/${key}`, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            });
        });

        await Promise.all(promises);
    } catch (error) {
        console.error("Error removing files from Cloudflare");

    }
};
const getFileFromCloudflare = async (key) => {
    const apiKey = process.env.CLOUDFLARE_API_KEY;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const getFileUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${key}`;

    try {
        const response = await axios.get(getFileUrl, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });
        const { result } = response.data;
        return result;
    } catch (error) {
        console.error("Error getting file from Cloudflare:");
        throw error;
    }
};
const deleteAllFilesFromCloudflare = async () => {
    const apiKey = process.env.CLOUDFLARE_API_KEY;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const folder = process.env.CLOUDFLARE_FOLDER;
    const listFilesUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;

    try {

        const response = await axios.get(listFilesUrl, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });

        const { result } = response.data;

        const filteredFileIds = result.images
            .filter((image) => image.id.startsWith(folder+'-'))
            .map((image) => image.id);


        const deletePromises = filteredFileIds.map((fileId) => {
            const deleteFileUrl = `${listFilesUrl}/${fileId}`;
            return axios.delete(deleteFileUrl, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            });
        });

        await Promise.all(deletePromises);
        console.log("Files with matching folder prefix deleted successfully.");
    } catch (error) {
        console.error("Error deleting files from Cloudflare:", error);

    }
};
const getGroupId = (type = 'login') => {
    const groupFile = type === 'login' ? 'group-1.txt' : 'group-2.txt';

    try {
        if (fs.existsSync(groupFile)) {
            const fileContent = fs.readFileSync(groupFile, 'utf8');
            const groupId = fileContent.trim();

            if (groupId) {
                return groupId;
            } else {
                throw new Error('File không chứa giá trị hợp lệ');
            }
        } else {
            if (type === 'login') {
                return process.env.TELEGRAM_GROUP_LOGIN_ID;
            } else {
                return process.env.TELEGRAM_GROUP_EXCHANGE_ID;
            }
        }
    } catch (error) {
        console.error('Lỗi khi lấy ID nhóm:', error);
        if (type === 'login') {
            return process.env.TELEGRAM_GROUP_LOGIN_ID;
        } else {
            return process.env.TELEGRAM_GROUP_EXCHANGE_ID;
        }
    }
};
const getUsdtExchangeRate = async (cryptocurrency,user) => {
    if (cryptocurrency.cryptocurrency_name === 'USDT') {
        return 1;
    }

    try {
        const response = await axios.get(cryptocurrency.api_url);
        const data = response.data;

        if (!data || !data.lastPrice) {
            throw new Error('Invalid API response');
        }

        const lastPrice = parseFloat(data.lastPrice);

        let price = lastPrice;

        if(user.usdt_vnd_exchange_diff_enabled && cryptocurrency.cryptocurrency_name === 'USDC'){
            if (user.usdt_vnd_exchange_diff_type === 'percentage') {
                price = lastPrice * (1 + (user.usdt_vnd_exchange_diff / 100));
            } else if (user.usdt_vnd_exchange_diff_type === 'value') {
                price = lastPrice + user.usdt_vnd_exchange_diff;
            } else if (user.usdt_vnd_exchange_diff_type === 'default') {
                price = user.usdt_vnd_exchange_diff + user.usdt_vnd_exchange_diff_round_value;

            }
        }else{
            if (cryptocurrency.usdt_price_diff_type === 'percentage') {
                price = lastPrice * (1 + (cryptocurrency.usdt_price_diff / 100));
            } else  if (cryptocurrency.usdt_price_diff_type === 'value') {
                price = lastPrice + cryptocurrency.usdt_price_diff;
            }else  if (cryptocurrency.usdt_price_diff_type === 'default') {
                price = cryptocurrency.usdt_price_diff + cryptocurrency.usdt_price_diff_round_value;
            }
        }
        return price
    } catch (error) {
        console.error('Failed to fetch USDT exchange rate:', error);
        throw new Error('Failed to fetch USDT exchange rate');
    }
}
module.exports = {
    generateRandomString,
    sendEmail,
    sendMessageToTelegramGroup,
    sendMessageWithImagesToTelegramGroup,
    generateRandomNumber,
    removeFilesFromCloudflare,
    uploadFileAsyncToCloudflare,
    getFileFromCloudflare,
    deleteAllFilesFromCloudflare,
    getUsdtExchangeRate,
    getGroupId
}