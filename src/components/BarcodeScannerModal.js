'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScannerModal({ onClose, onDetect }) {
    const scannerRef = useRef(null);
    const [error, setError] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [html5QrCode, setHtml5QrCode] = useState(null);

    // 1. Busca as câmeras disponiveis no celular/pc
    useEffect(() => {
        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length) {
                setCameras(devices);
                // Pré-selecionar a traseira de preferência a "camera 0, facing back" como o usuário solicitou
                const backCamera0 = devices.find(d => 
                    (d.label.toLowerCase().includes('camera 0') || d.label.toLowerCase().includes('câmera 0')) && 
                    (d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('traseira'))
                );
                const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('traseira'));
                
                setSelectedCamera(backCamera0 ? backCamera0.id : (backCamera ? backCamera.id : devices[devices.length - 1].id));
            }
        }).catch(err => {
            console.error("Camera detection error:", err);
            setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
        });
    }, []);

    // 2. Inicia/Reinicia o scanner quando a câmera selecionada muda
    useEffect(() => {
        if (!selectedCamera) return;

        // Criamos uma nova instância limpa para a câmera selecionada
        const qrCodeInstance = new Html5Qrcode("reader");
        let isStarted = false;
        
        let isStopping = false;
        
        async function startScanner() {
            try {
                setError('');
                setIsScanning(false);
                
                const config = { 
                    qrbox: { width: 250, height: 150 },
                    formatsToSupport: [0, 1, 4, 5, 6, 14, 15] // EANs e UPCs
                };

                await qrCodeInstance.start(
                    selectedCamera, // ID específico da câmera
                    config,
                    (decodedText) => {
                        if (isStarted && !isStopping) {
                            isStopping = true; // Previne múltiplas leituras simultâneas
                            try {
                                const audio = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//tQxOAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
                                audio.play().catch(e => console.log('Audio denied'));
                            } catch (e) {}

                            // Apenas passa o código para a tela principal
                            // O `ProductList` vai mudar o estado, desmontar esse Modal, 
                            // e nossa função de `return () => {}` lá embaixo vai desligar a câmera com segurança uma única vez.
                            onDetect(decodedText);
                        }
                    },
                    (errorMessage) => { }
                );
                
                isStarted = true;
                setIsScanning(true);
            } catch (err) {
                console.error("Camera access error:", err);
                setError(`Erro na lente: ${err.message || err}. Tente outra.`);
            }
        }

        startScanner();

        // Função de limpeza quando a câmera muda ou o modal fecha
        return () => {
            isStopping = true;
            if (isStarted) {
                qrCodeInstance.stop().then(() => {
                    try { qrCodeInstance.clear(); } catch(e){}
                }).catch(e => console.error("Erro ao fechar camera antiga", e));
            } else {
                try { qrCodeInstance.clear(); } catch(e){}
            }
        };
    }, [selectedCamera, onDetect]); // Recarrega SEMPRE que a câmera muda

    return (
        <div className="modal-overlay">
            <div className="modal scanner-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>📷 Ler Código de Barras</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body" style={{ textAlign: 'center' }}>
                    
                    {cameras.length > 1 && (
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#007bff' }}>
                                📸 Escolha a Câmera / Lente:
                            </label>
                            <select 
                                className="form-input" 
                                value={selectedCamera} 
                                onChange={e => setSelectedCamera(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    padding: '12px',
                                    fontSize: '1em',
                                    fontWeight: 'bold',
                                    backgroundColor: '#f0f8ff',
                                    border: '2px solid #007bff',
                                    borderRadius: '8px',
                                    color: '#333'
                                }}
                            >
                                {cameras.map(cam => (
                                    <option key={cam.id} value={cam.id}>
                                        {cam.label || `Câmera ${cam.id.substring(0, 5)}...`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    {error ? (
                        <div className="alert alert-error">{error}</div>
                    ) : (
                        <div 
                            id="reader" 
                            style={{ 
                                width: '100%', 
                                maxWidth: '400px', 
                                margin: '0 auto',
                                borderRadius: '8px',
                                overflow: 'hidden'
                            }}
                        ></div>
                    )}
                    
                    {!error && <p style={{ fontSize: '0.85em', color: '#666', marginTop: '10px' }}>Procurando código...</p>}
                </div>
                
                <div className="modal-actions" style={{ marginTop: '20px' }}>
                    <button type="button" className="btn btn-secondary w-100" onClick={onClose}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
