import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'SIS DAVUS - Controle de Estoque e Patrimônio'
export const size = {
    width: 1200,
    height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 60,
                    background: 'linear-gradient(to bottom right, #001f3f, #0074D9)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontFamily: 'sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 20
                    }}
                >
                    {/* Actual Logo Representation */}
                    <svg
                        width="120"
                        height="120"
                        viewBox="0 0 2084 2084"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ color: '#ffffff' }}
                    >
                        <path d="M852.344,1522.352c142.079,0 257.682,-115.451 257.682,-257.335l0,-704.362l-515.386,0l0,961.697l257.704,0Zm-435.373,177.539l0,-1316.667l870.833,0l0,881.793c0,239.757 -195.312,434.787 -435.373,434.787l-435.46,0.087Z" fill="white" />
                        <path d="M-27.713,555.534l558.659,1437.652l1201.519,-465.625l-558.637,-1437.652l-1201.541,465.625Z" fill="#fc5e38" />
                        <rect x="1489.518" y="383.225" width="175" height="175" fill="#e5846b" />
                    </svg>
                </div>
                <div style={{ fontWeight: 900, fontSize: 80, marginBottom: 10 }}>SIS DAVUS</div>
                <div style={{ fontSize: 32, opacity: 0.8, fontWeight: 300 }}>Controle de Estoque e Patrimônio</div>
                <div style={{
                    marginTop: 40,
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '10px 30px',
                    borderRadius: 50,
                    fontSize: 24
                }}>
                    deltarise.com.br
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
