const express = require('express');
const router = express.Router();
const UserWalletAddress = require('../../model/user_wallet_addresses');
const { body, validationResult } = require('express-validator');

// Lấy danh sách địa chỉ ví của người dùng
router.get('/', async (req, res) => {
    const userId = req.user.id;
    const { cryptocurrency } = req.query;

    try {
        const query = { user: userId };

        if (cryptocurrency) {
            query.cryptocurrency = cryptocurrency;
        }

        const userWalletAddresses = await UserWalletAddress.find(query);
        res.json(userWalletAddresses);
    } catch (error) {
        res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách địa chỉ ví' });
    }
});

// Thêm địa chỉ ví mới
router.post(
    '/',
    [
        body('cryptocurrency').notEmpty().withMessage('Loại tiền điện tử không được để trống'),
        body('address').notEmpty().withMessage('Địa chỉ ví không được để trống'),
        body('address').notEmpty().withMessage('Mạng lưới không được để trống'),
        body('name').notEmpty().withMessage('Tên không được để trống'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const userId = req.user.id;
        const { cryptocurrency, address, network,name } = req.body;
        const newUserWalletAddress = new UserWalletAddress({
            user: userId,
            cryptocurrency,
            address,
            network,
            name,
        });
        try {
            const savedUserWalletAddress = await newUserWalletAddress.save();
            res.status(201).json(savedUserWalletAddress);
        } catch (error) {
            res.status(400).json({ message: 'Đã xảy ra lỗi khi thêm địa chỉ ví mới' });
        }
    }
);

// Cập nhật thông tin địa chỉ ví
router.put(
    '/:id',
    [
        body('cryptocurrency').notEmpty().withMessage('Loại tiền điện tử không được để trống'),
        body('address').notEmpty().withMessage('Địa chỉ ví không được để trống'),
        body('address').notEmpty().withMessage('Mạng lưới không được để trống'),
        body('name').notEmpty().withMessage('Tên không được để trống'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { cryptocurrency, address, network,name } = req.body;
        try {
            const updatedUserWalletAddress = await UserWalletAddress.findByIdAndUpdate(
                req.params.id,
                { cryptocurrency, address, network,name },
                { new: true }
            );
            res.json(updatedUserWalletAddress);
        } catch (error) {
            res.status(400).json({ message: 'Đã xảy ra lỗi khi cập nhật thông tin địa chỉ ví' });
        }
    }
);

// Xóa một địa chỉ ví
router.delete('/:id', async (req, res) => {
    try {
        await UserWalletAddress.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa địa chỉ ví thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa địa chỉ ví' });
    }
});

// Xóa nhiều địa chỉ ví
router.delete(
    '/',
    [
        body('ids').isArray().withMessage('IDs phải là một mảng'),
        body('ids.*').isMongoId().withMessage('ID không hợp lệ'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const ids = req.body.ids;
        try {
            await UserWalletAddress.deleteMany({ _id: { $in: ids } });
            res.json({ message: 'Đã xóa các địa chỉ ví thành công' });
        } catch (error) {
            res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa các địa chỉ ví' });
        }
    }
);

module.exports = router;