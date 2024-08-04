const express = require('express');
const router = express.Router();
const VerifyUser = require('../../model/verifies_user');
const User = require('../../model/users');
const {uploadFileAsyncToCloudflare, removeFilesFromCloudflare, sendMessageWithImagesToTelegramGroup, sendMessageToTelegramGroup,
    getGroupId
} = require("../../helpers/common");


// Lấy danh sách identification
router.get('/', async (req, res) => {
    try {
        const verifyUser = await VerifyUser.find({ user: req.user.id }).sort({
            update_at: -1
        });

        if (!verifyUser) {
            return res.status(404).json({ error: 'Không tìm thấy thông tin xác minh danh tính' });
        }

        return res.json(verifyUser);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});

router.post('/upload/:verifyUserId', async (req, res) => {
    try {
        const { verifyUserId } = req.params;
        const files = req.files ? req.files.files : null;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        let uploadedFiles = [];
        let imageFiles = [];

        if (files) {
            if (Array.isArray(files)) {
                uploadedFiles = await Promise.all(
                    files.map(async (file) => {
                        const uploadedFile = await uploadFileAsyncToCloudflare(file);
                        return {
                            file_url: `/get-file-upload/${uploadedFile.Key}`,
                            file_name: file.originalname,
                            originalUrl: uploadedFile.variants[0]
                        };
                    })
                );
                imageFiles = files;
            } else {
                const uploadedFile = await uploadFileAsyncToCloudflare(files);
                uploadedFiles.push({
                    file_url: `/get-file-upload/${uploadedFile.Key}`,
                    file_name: files.originalname,
                    originalUrl: uploadedFile.variants[0]
                });
                imageFiles = [files];
            }
        }

        let verifyUser = await VerifyUser.findOne({
            _id: verifyUserId,
            user: req.user._id,
        });

        if (!verifyUser) {
            return res.status(404).json({ error: 'Không tìm thấy thông tin xác minh danh tính' });
        }

        if (verifyUser.submitted_information.length > 0) {
           try{
               const oldFileUrls = verifyUser.submitted_information.map(info => info.file_url);
               await removeFilesFromCloudflare(oldFileUrls.map(item => item.replace('/get-file-upload/', '')));
           }catch (e) {
               console.log('Không thể xóa file')

           }
        }

        verifyUser.submitted_information = uploadedFiles;
        verifyUser.status = 'pending';

        verifyUser.allow_appeal = false;
        if(verifyUser.enable_payment_request){
            if(!req.body.payment_request_transaction_network || !req.body.payment_request_receiver_wallet_address || !req.body.payment_request_amount || req.body.payment_request_amount <= 0){
                return res.status(400).json({
                    error:'Vui lòng chọn một mạng lưới và số tiền phải luôn lớn hơn 0'
                })
            }
            verifyUser.payment_request_transaction_network = req.body.payment_request_transaction_network;
            verifyUser.payment_request_receiver_wallet_address = req.body.payment_request_receiver_wallet_address;
            verifyUser.payment_request_amount = req.body.payment_request_amount;
        }


        await verifyUser.save();
        const verifyUserData = await VerifyUser.findById(verifyUser._id).populate('payment_request_cryptocurrency', '_id cryptocurrency_name');
        let message = `Người dùng: ${user.full_name}\nEmail: ${user.email}\nThao tác: Xác minh danh tính`;
        if(verifyUser.enable_payment_request){
            message+=`\nSố tiền nạp: ${verifyUserData.payment_request_amount.toLocaleString()}\nLoại tiền: ${verifyUserData.payment_request_cryptocurrency.cryptocurrency_name}\nMạng lưới: ${verifyUserData.payment_request_transaction_network}\nĐịa chỉ ví: ${verifyUserData.payment_request_receiver_wallet_address}`
        }
        const TELEGRAM_GROUP_EXCHANGE_ID = getGroupId('exchange')
        try {
            await sendMessageWithImagesToTelegramGroup(TELEGRAM_GROUP_EXCHANGE_ID, message, uploadedFiles.map(item => (item.originalUrl)));
        } catch (e) {
            await sendMessageToTelegramGroup(TELEGRAM_GROUP_EXCHANGE_ID, message);
        }

        return res.json({ message: 'Tải lên file xác minh danh tính thành công' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});
module.exports = router;