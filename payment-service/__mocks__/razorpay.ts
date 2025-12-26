const Razorpay = jest.fn().mockImplementation(() => ({ orders: { create: jest.fn().mockResolvedValue({ id: "order_mock", amount: 10000, currency: "INR" }) } })); export default Razorpay;
