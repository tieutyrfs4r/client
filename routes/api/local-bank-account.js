const express = require('express');
const router = express.Router();
const LocalBankAccount = require('../../model/local_bank_account');
const User = require('../../model/users');
const { body, validationResult } = require('express-validator');

// Lấy danh sách tài khoản ngân hàng của người dùng
router.get('/', async (req, res) => {
    const userId = req.user.id;
    try {
        const localBankAccounts = await LocalBankAccount.find({ user: userId });
        res.json(localBankAccounts);
    } catch (error) {
        res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách tài khoản ngân hàng' });
    }
});

// Thêm tài khoản ngân hàng mới
router.post(
    '/',
    [
        body('name').notEmpty().withMessage('Tên tài khoản không được để trống'),
        body('account_number').notEmpty().withMessage('Số tài khoản không được để trống'),
        body('account_name').notEmpty().withMessage('Tên chủ tài khoản không được để trống'),
        body('bank_name').notEmpty().withMessage('Tên ngân hàng không được để trống'),
        body('branch_name').notEmpty().withMessage('Tên chi nhánh không được để trống'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const userId = req.user.id;
        const { name, account_number, account_name, bank_name, branch_name } = req.body;
        const newLocalBankAccount = new LocalBankAccount({
            user: userId,
            name,
            account_number,
            account_name,
            bank_name,
            branch_name,
        });
        try {
            const savedLocalBankAccount = await newLocalBankAccount.save();
            res.status(201).json(savedLocalBankAccount);
        } catch (error) {
            res.status(400).json({ message: 'Đã xảy ra lỗi khi thêm tài khoản ngân hàng mới' });
        }
    }
);

// Cập nhật thông tin tài khoản ngân hàng
router.put(
    '/:id',
    [
        body('name').notEmpty().withMessage('Tên tài khoản không được để trống'),
        body('account_number').notEmpty().withMessage('Số tài khoản không được để trống'),
        body('account_name').notEmpty().withMessage('Tên chủ tài khoản không được để trống'),
        body('bank_name').notEmpty().withMessage('Tên ngân hàng không được để trống'),
        body('branch_name').notEmpty().withMessage('Tên chi nhánh không được để trống'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { name, account_number, account_name, bank_name, branch_name } = req.body;
        try {
            const updatedLocalBankAccount = await LocalBankAccount.findByIdAndUpdate(
                req.params.id,
                { name, account_number, account_name, bank_name, branch_name },
                { new: true }
            );
            res.json(updatedLocalBankAccount);
        } catch (error) {
            res.status(400).json({ message: 'Đã xảy ra lỗi khi cập nhật thông tin tài khoản ngân hàng' });
        }
    }
);

// Xóa một tài khoản ngân hàng
router.delete('/:id', async (req, res) => {
    try {
        await LocalBankAccount.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa tài khoản ngân hàng thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa tài khoản ngân hàng' });
    }
});

// Xóa nhiều tài khoản ngân hàng
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
            await LocalBankAccount.deleteMany({ _id: { $in: ids } });
            res.json({ message: 'Đã xóa các tài khoản ngân hàng thành công' });
        } catch (error) {
            res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa các tài khoản ngân hàng' });
        }
    }
);

module.exports = router;