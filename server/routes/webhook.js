router.post("/webhook", async (req, res) => {
    const chapaSignature = req.headers["x-chapa-signature"];
    const transactionRef = req.body.tx_ref;

    try {
        // Verify the transaction
        const response = await axios.get(`https://api.chapa.co/v1/transaction/verify/${transactionRef}`, {
            headers: {
                Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
            },
        });

        if (response.data.status === "success") {
            console.log("Payment Successful:", response.data);
            res.status(200).json({ message: "Payment verified successfully" });
        } else {
            res.status(400).json({ message: "Payment verification failed" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error verifying payment" });
    }
});

export default router;
