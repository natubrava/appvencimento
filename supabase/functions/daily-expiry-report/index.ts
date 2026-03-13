import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const resendApiKey = Deno.env.get("RESEND_API_KEY")
const supabaseUrl = Deno.env.get("SUPABASE_URL")
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

serve(async (req) => {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method Not Allowed" }), { 
            status: 405, 
            headers: { "Content-Type": "application/json" } 
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
                headers: { "Content-Type": "application/json" } 
            })
        }

        const expiredItems = []
        const urgentItems = []
        const warningItems = []

        expiryRecords.forEach(record => {
            const expDate = new Date(record.expiry_date);
            const todayLocal = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
            const objDateLocal = new Date(expDate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
            
            todayLocal.setHours(0, 0, 0, 0);
            objDateLocal.setHours(0, 0, 0, 0);
        
            const diffTime = (objDateLocal.getTime() - todayLocal.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let status = 'ok';
            if (diffDays <= 0) {
                status = 'expired';
                expiredItems.push({...record, days: diffDays});
            } else if (diffDays <= alertRedDays) {
                status = 'urgent';
                urgentItems.push({...record, days: diffDays});
            } else if (diffDays <= alertYellowDays) {
                status = 'warning';
                warningItems.push({...record, days: diffDays});
            }
        });

        if (expiredItems.length === 0 && urgentItems.length === 0 && warningItems.length === 0) {
            return new Response(JSON.stringify({ message: "No items expiring soon or expired." }), { 
                headers: { "Content-Type": "application/json" } 
            })
        }

        let htmlBody = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #2c3e50; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 15px;">Alerta de Vencimentos - NatuBrava</h2>
                <p>Aqui está o resumo dos produtos que requerem atenção hoje (${new Date().toLocaleDateString('pt-BR')}).</p>
        `

        if (expiredItems.length > 0) {
            htmlBody += `
                <div style="background-color: #fff3f3; border-left: 4px solid #721c24; padding: 10px 15px; margin-bottom: 20px;">
                    <h3 style="color: #721c24; margin-top: 0;">⚫ Vencidos (${expiredItems.length})</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #f5c6cb; text-align: left;">
                            <th style="padding: 5px;">Produto</th><th style="padding: 5px;">Dias</th><th style="padding: 5px;">Qtd</th>
                        </tr>
                        ${expiredItems.map(item => `
                            <tr>
                                <td style="padding: 5px; font-size: 14px;">${item.product_name} (SKU: ${item.sku})</td>
                                <td style="padding: 5px; font-size: 14px; color: #721c24; font-weight: bold;">Vencido há ${Math.abs(item.days)}d</td>
                                <td style="padding: 5px; font-size: 14px;">${item.quantity || 1}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            `
        }

        if (urgentItems.length > 0) {
            htmlBody += `
                <div style="background-color: #fff8eb; border-left: 4px solid #e74c3c; padding: 10px 15px; margin-bottom: 20px;">
                    <h3 style="color: #e74c3c; margin-top: 0;">🔴 Urgente (${urgentItems.length}) - Menos de ${alertRedDays} dias</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #fbeed5; text-align: left;">
                            <th style="padding: 5px;">Produto</th><th style="padding: 5px;">Vence Em</th><th style="padding: 5px;">Qtd</th>
                        </tr>
                        ${urgentItems.map(item => `
                            <tr>
                                <td style="padding: 5px; font-size: 14px;">${item.product_name} (SKU: ${item.sku})</td>
                                <td style="padding: 5px; font-size: 14px; color: #e74c3c; font-weight: bold;">${item.days}d</td>
                                <td style="padding: 5px; font-size: 14px;">${item.quantity || 1}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            `
        }

        if (warningItems.length > 0) {
            htmlBody += `
                <div style="background-color: #fffdf5; border-left: 4px solid #f1c40f; padding: 10px 15px; margin-bottom: 20px;">
                    <h3 style="color: #d4ac0d; margin-top: 0;">🟡 Atenção (${warningItems.length}) - Menos de ${alertYellowDays} dias</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #fcf7d7; text-align: left;">
                            <th style="padding: 5px;">Produto</th><th style="padding: 5px;">Vence Em</th><th style="padding: 5px;">Qtd</th>
                        </tr>
                        ${warningItems.map(item => `
                            <tr>
                                <td style="padding: 5px; font-size: 14px;">${item.product_name} (SKU: ${item.sku})</td>
                                <td style="padding: 5px; font-size: 14px; color: #d4ac0d; font-weight: bold;">${item.days}d</td>
                                <td style="padding: 5px; font-size: 14px;">${item.quantity || 1}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            `
        }

        htmlBody += `
                <div style="margin-top: 20px; text-align: center; border-top: 1px solid #ddd; padding-top: 15px;">
                    <a href="https://controle-vencimento-natu.vercel.app/" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar Sistema</a>
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
            headers: { "Content-Type": "application/json" } 
        })

    } catch (err) {
        console.error("Function error:", err.message)
        return new Response(JSON.stringify({ error: err.message }), { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
        })
    }
})
