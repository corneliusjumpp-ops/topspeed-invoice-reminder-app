export default function PaymentSuccess() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#f5f5f5'
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
        }}
      >
        <h1>Payment Successful ✅</h1>

        <p style={{ fontSize: '18px', marginTop: '20px' }}>
          Thank you for your payment to TopSpeed Piano Moving LLC.
        </p>

        <p>Your payment has been received.</p>
      </div>
    </main>
  )
}
