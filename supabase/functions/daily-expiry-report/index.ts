import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const resendApiKey = Deno.env.get("RESEND_API_KEY")
const supabaseUrl = Deno.env.get("SUPABASE_URL")
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method Not Allowed" }), { 
            status: 405, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
        })
    }

    try {
        if (!resendApiKey || !supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing environment variables. Make sure RESEND_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.")
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { data: settingsData, error: settingsError } = await supabase
            .from("settings")
            .select("*")
            .single()

        if (settingsError) throw new Error("Error fetching settings: " + settingsError.message)

        const alertYellowDays = settingsData?.alert_yellow_days || 90
        const alertRedDays = settingsData?.alert_red_days || 60

        const notificationEmail = settingsData?.notification_email || "natubrava@gmail.com"

        const { data: expiryRecords, error: expiryError } = await supabase
            .from("expiry_records")
            .select("*")
            .eq("status", "active")
        
        if (expiryError) throw new Error("Error fetching expiry records: " + expiryError.message)

        if (!expiryRecords || expiryRecords.length === 0) {
            return new Response(JSON.stringify({ message: "No active products." }), { 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            })
        }

        const expiringItems = []

        expiryRecords.forEach(record => {
            const expDate = new Date(record.expiry_date);
            const todayLocal = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
            const objDateLocal = new Date(expDate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
            
            todayLocal.setHours(0, 0, 0, 0);
            objDateLocal.setHours(0, 0, 0, 0);
        
            const diffTime = (objDateLocal.getTime() - todayLocal.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let status = 'ok';
            let statusColor = '#10b981'; // green
            let statusBg = '#ecfdf5';
            let statusLabel = 'No Prazo';

            if (diffDays < 0) {
                status = 'vencido';
                statusColor = '#fff';
                statusBg = '#1f2937'; // black (preto)
                statusLabel = 'Vencido';
            } else if (diffDays <= alertRedDays) {
                status = 'urgente';
                statusColor = '#ef4444'; // red (vermelho)
                statusBg = '#fef2f2';
                statusLabel = 'Urgente';
            } else if (diffDays <= alertYellowDays) {
                status = 'atencao';
                statusColor = '#f59e0b'; // yellow (amarelo)
                statusBg = '#fffbeb';
                statusLabel = 'Atenção';
            }

            expiringItems.push({...record, days: diffDays, expDateObj: objDateLocal, status, statusColor, statusBg, statusLabel});
        });

        if (expiringItems.length === 0) {
            return new Response(JSON.stringify({ message: "No active products." }), { 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            })
        }

        // Sort items by expiration date (most overdue first)
        expiringItems.sort((a, b) => a.days - b.days);

        const totalCount = expiringItems.length;
        const vencidosCount = expiringItems.filter(i => i.status === 'vencido').length;
        const urgenteCount = expiringItems.filter(i => i.status === 'urgente').length;
        const atencaoCount = expiringItems.filter(i => i.status === 'atencao').length;
        const noPrazoCount = expiringItems.filter(i => i.status === 'ok').length;
        const promocoesCount = expiringItems.filter(i => i.is_promoted).length;

        const reportDateObj = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const reportDateStr = `${String(reportDateObj.getDate()).padStart(2, '0')}/${String(reportDateObj.getMonth() + 1).padStart(2, '0')}/${reportDateObj.getFullYear()}`;

        const htmlBody = `
            <div style="font-family: Arial, sans-serif; background-color: #f4f7f6; padding: 20px 0;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #1e8449, #2ecc71); text-align: center; padding: 30px 20px 45px; color: white;">
                        <h2 style="margin: 0; font-size: 24px; font-weight: bold;">🌿 NatuBrava - Alertas de Vencimento</h2>
                        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Resumo do dia ${reportDateStr}</p>
                    </div>

                    <!-- Summary Cards Container -->
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; margin: -25px 20px 20px 20px; gap: 8px;">
                        <!-- Total -->
                        <div style="background: #ffffff; border-radius: 8px; padding: 12px 5px; flex: 1 1 30%; min-width: 90px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 22px; font-weight: bold; color: #4b5563; line-height: 1;">${totalCount}</div>
                            <div style="font-size: 11px; color: #6b7280; margin-top: 5px; font-weight: bold; text-transform: uppercase;">Total</div>
                        </div>
                        <!-- Vencidos -->
                        <div style="background: #1f2937; border-radius: 8px; padding: 12px 5px; flex: 1 1 30%; min-width: 90px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 22px; font-weight: bold; color: #ffffff; line-height: 1;">${vencidosCount}</div>
                            <div style="font-size: 11px; color: #d1d5db; margin-top: 5px; font-weight: bold; text-transform: uppercase;">Vencidos</div>
                        </div>
                        <!-- Urgentes -->
                        <div style="background: #fef2f2; border-radius: 8px; padding: 12px 5px; flex: 1 1 30%; min-width: 90px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 22px; font-weight: bold; color: #ef4444; line-height: 1;">${urgenteCount}</div>
                            <div style="font-size: 11px; color: #ef4444; margin-top: 5px; font-weight: bold; text-transform: uppercase;">Urgente</div>
                        </div>
                        <!-- Atenção -->
                        <div style="background: #fffbeb; border-radius: 8px; padding: 12px 5px; flex: 1 1 30%; min-width: 90px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 22px; font-weight: bold; color: #f59e0b; line-height: 1;">${atencaoCount}</div>
                            <div style="font-size: 11px; color: #f59e0b; margin-top: 5px; font-weight: bold; text-transform: uppercase;">Atenção</div>
                        </div>
                        <!-- No Prazo -->
                        <div style="background: #ecfdf5; border-radius: 8px; padding: 12px 5px; flex: 1 1 30%; min-width: 90px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 22px; font-weight: bold; color: #10b981; line-height: 1;">${noPrazoCount}</div>
                            <div style="font-size: 11px; color: #10b981; margin-top: 5px; font-weight: bold; text-transform: uppercase;">No Prazo</div>
                        </div>
                        <!-- Promoção -->
                        <div style="background: #fef08a; border-radius: 8px; padding: 12px 5px; flex: 1 1 30%; min-width: 90px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 22px; font-weight: bold; color: #854d0e; line-height: 1;">${promocoesCount}</div>
                            <div style="font-size: 11px; color: #854d0e; margin-top: 5px; font-weight: bold; text-transform: uppercase;">Promoções</div>
                        </div>
                    </div>

                    <!-- List -->
                    <div style="padding: 0 20px 20px;">
                        <h3 style="font-size: 16px; color: #4b5563; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 8px;">Relatório de Produtos</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 1px solid #eee;">
                                    <th style="text-align: left; padding-bottom: 15px; font-size: 12px; color: #757575; letter-spacing: 0.5px;">PRODUTO</th>
                                    <th style="text-align: right; padding-bottom: 15px; font-size: 12px; color: #757575; letter-spacing: 0.5px;">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${expiringItems.map(item => {
                                    const expDateStr = String(item.expDateObj.getDate()).padStart(2, '0') + '/' + String(item.expDateObj.getMonth() + 1).padStart(2, '0') + '/' + item.expDateObj.getFullYear();
                                    
                                    let daysText = '';
                                    if (item.status === 'vencido') daysText = `Vencido há ${Math.abs(item.days)} dia(s)`;
                                    else if (item.status === 'urgente' || item.status === 'atencao') daysText = `Vence em ${item.days} dia(s)`;
                                    else daysText = `Mais de ${item.days} dia(s)`;

                                    const promoTagHtml = item.is_promoted ? `<span style="margin-top: 4px; display: inline-block; font-size: 10px; background-color: #fef08a; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-weight: bold;">🟡 Em Promoção</span>` : '';

                                    return `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 15px 0; padding-right: 15px;">
                                            <div style="font-weight: bold; font-size: 13px; color: #212121; line-height: 1.4; text-transform: uppercase;">${item.product_name}</div>
                                            <div style="font-size: 12px; color: #9e9e9e; margin-top: 4px;">${expDateStr} | Lote: ${item.sku || '-'}</div>
                                            ${promoTagHtml}
                                        </td>
                                        <td style="text-align: right; padding: 15px 0; vertical-align: middle;">
                                            <div style="background-color: ${item.statusBg}; color: ${item.statusColor}; display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; border: 1px solid ${item.status === 'vencido' ? '#1f2937' : item.statusColor};">
                                                ${item.statusLabel}
                                            </div>
                                            <div style="font-size: 11px; color: #9e9e9e; margin-top: 4px;">${daysText}</div>
                                        </td>
                                    </tr>
                                    `
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div style="text-align: center; padding: 30px 20px 10px;">
                    <a href="https://natubrava.github.io/appvencimento/" style="background-color: #5d6d7e; color: white; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block; font-size: 15px;">Acessar Sistema</a>
                </div>
            </div>
        `

        const resendReq = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: "Controle de Vencimentos <onboarding@resend.dev>",
                to: [notificationEmail],
                subject: `⚠️ Relatório de Vencimentos - ${new Date().toLocaleDateString('pt-BR')}`,
                html: htmlBody
            })
        })

        if (!resendReq.ok) {
            const resendError = await resendReq.json()
            throw new Error("Failed to send email: " + JSON.stringify(resendError))
        }

        return new Response(JSON.stringify({ message: "Daily report email sent successfully!" }), { 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
        })

    } catch (err) {
        console.error("Function error:", err.message)
        return new Response(JSON.stringify({ error: err.message }), { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
        })
    }
})
