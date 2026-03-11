const transporter = require('../config/mail')

class EmailService {
    async sendOrderConfirmation(orderData) {
        if (!orderData.email) {
            throw new Error('Email получателя не указан');
        }
        const mailOptions = {
            from: `"Магазин SWAGA" `,
            to: orderData.email,
            subject: `Заказ`,
            html: this.generateOrderHtml(orderData),
        }

        try {
            const info = await transporter.sendMail(mailOptions)
            console.log(`Письмо отправлено на ${orderData.email}:`, info.messageId)
            return info
        } catch (error) {
            console.error('Ошибка отправки письма:', error)
            throw error
        }
    }

    generateOrderHtml(orderData) {
        return `
            <h1>Спасибо за заказ!</h1>
            <p>Номер заказа: ${orderData.orderId}</p>
            <p>Товар: ${orderData.title}</p>
            <p>Сумма: ${orderData.price} ₽</p>
        `
    }
}

module.exports = new EmailService()