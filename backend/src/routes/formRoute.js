const express = require('express');
const { createCustomer, getAllCustomers, getCustomerByMobile } = require('../controllers/formController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       required:
 *         - Name
 *         - MobileNo
 *       properties:
 *         Name:
 *           type: string
 *           maxLength: 100
 *           description: Customer full name
 *         MobileNo:
 *           type: string
 *           maxLength: 10
 *           description: Customer mobile number (10 digits)
 *         DOB:
 *           type: string
 *           format: date
 *           description: Date of birth
 *         DOA:
 *           type: string
 *           format: date
 *           description: Date of anniversary
 *         IsActive:
 *           type: string
 *           maxLength: 1
 *           default: Y
 *           description: Active status (Y/N)
 */

/**
 * @swagger
 * /customer:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Name
 *               - MobileNo
 *             properties:
 *               Name:
 *                 type: string
 *                 maxLength: 100
 *               MobileNo:
 *                 type: string
 *                 maxLength: 10
 *               DOB:
 *                 type: string
 *                 format: date
 *               DOA:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post('/customer', createCustomer);

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all active customers
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: List of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 *       500:
 *         description: Server error
 */
router.get('/customers', getAllCustomers);

/**
 * @swagger
 * /customer/{mobile}:
 *   get:
 *     summary: Get customer by mobile number
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: mobile
 *         schema:
 *           type: string
 *         required: true
 *         description: Customer mobile number
 *     responses:
 *       200:
 *         description: Customer details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.get('/customer/:mobile', getCustomerByMobile);

module.exports = router;