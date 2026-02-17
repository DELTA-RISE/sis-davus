
interface TemplateData {
  email?: string;
  reset_url?: string;
  new_email?: string;
  old_email?: string;
  ip_address?: string;
  device_info?: string;
  location?: string;
  time?: string;
  [key: string]: string | undefined;
}

export const EMAIL_TEMPLATES: Record<string, (data: TemplateData) => { subject: string; html: string }> = {
  "password-changed": (data) => ({
    subject: "Sua senha foi alterada - SIS DAVUS",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
             @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
            body { font-family: 'Sora', 'Segoe UI', sans-serif; background-color: #030405; color: #ededed; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #0d0f11; border: 1px solid #1f2226; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); }
            .header { background: #16181b; padding: 32px; text-align: center; border-bottom: 1px solid #1f2226; }
            .logo { font-size: 24px; font-weight: 700; color: #ededed; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; }
            .logo span { color: #ff5d38; }
            .content { padding: 40px 32px; }
            .alert-box { background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 32px; border-radius: 4px; }
            .alert-title { color: #ef4444; font-weight: 600; margin-bottom: 4px; display: block; }
            .alert-text { color: #fca5a5; font-size: 14px; margin: 0; }
            h2 { color: #ffffff; font-size: 24px; margin: 0 0 24px; text-align: center; }
            p { line-height: 1.6; margin-bottom: 24px; color: #a1a1aa; font-size: 16px; text-align: center; }
            .footer { background: #16181b; padding: 24px; text-align: center; font-size: 12px; color: #52525b; border-top: 1px solid #1f2226; }
            .btn { display: block; width: fit-content; margin: 32px auto; background-color: #ff5d38; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SIS <span>DAVUS</span></div>
            </div>
            <div class="content">
              <h2>Senha Alterada</h2>
              <div class="alert-box">
                <span class="alert-title">Aviso de Segurança</span>
                <p class="alert-text">A senha da sua conta foi alterada recentemente.</p>
              </div>
              <p>Detectamos que a senha da sua conta <strong>${data.email}</strong> foi alterada em ${new Date().toLocaleString('pt-BR')}.</p>
              <p>Se foi você quem realizou esta alteração, pode ignorar este e-mail.</p>
              <p><strong>Se você NÃO realizou esta alteração, recupere sua conta imediatamente.</strong></p>
              
              <a href="${data.reset_url || '#'}" class="btn">Recuperar Minha Conta</a>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SIS DAVUS. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),
  "email-changed": (data) => ({
    subject: "Seu e-mail foi atualizado - SIS DAVUS",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
            body { font-family: 'Sora', 'Segoe UI', sans-serif; background-color: #030405; color: #ededed; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #0d0f11; border: 1px solid #1f2226; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); }
            .header { background: #16181b; padding: 32px; text-align: center; border-bottom: 1px solid #1f2226; }
            .logo { font-size: 24px; font-weight: 700; color: #ededed; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; }
            .logo span { color: #ff5d38; }
            .content { padding: 40px 32px; text-align: center; }
            h2 { color: #ffffff; font-size: 24px; margin: 0 0 24px; }
            p { line-height: 1.6; margin-bottom: 24px; color: #a1a1aa; font-size: 16px; }
            .footer { background: #16181b; padding: 24px; text-align: center; font-size: 12px; color: #52525b; border-top: 1px solid #1f2226; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SIS <span>DAVUS</span></div>
            </div>
            <div class="content">
              <h2>E-mail Atualizado</h2>
              <p>O endereço de e-mail associado à sua conta foi alterado recentemente para <strong>${data.new_email}</strong>.</p>
              <p>Se você não solicitou esta alteração, entre em contato com o administrador do sistema imediatamente.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SIS DAVUS. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),
  "mfa-added": (_) => ({
    subject: "Autenticação em Dois Fatores Adicionada - SIS DAVUS",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
             @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
            body { font-family: 'Sora', 'Segoe UI', sans-serif; background-color: #030405; color: #ededed; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #0d0f11; border: 1px solid #1f2226; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); }
            .header { background: #16181b; padding: 32px; text-align: center; border-bottom: 1px solid #1f2226; }
            .logo { font-size: 24px; font-weight: 700; color: #ededed; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; }
            .logo span { color: #ff5d38; }
            .content { padding: 40px 32px; text-align: center; }
            h2 { color: #ffffff; font-size: 24px; margin: 0 0 24px; }
            p { line-height: 1.6; margin-bottom: 24px; color: #a1a1aa; font-size: 16px; }
            .footer { background: #16181b; padding: 24px; text-align: center; font-size: 12px; color: #52525b; border-top: 1px solid #1f2226; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SIS <span>DAVUS</span></div>
            </div>
            <div class="content">
              <h2>2FA Adicionado</h2>
              <p>Um novo método de Autenticação em Dois Fatores (2FA) foi adicionado à sua conta.</p>
              <p>Isso aumenta a segurança da sua conta.</p>
              <p style="margin-top: 24px; font-size: 14px; color: #ef4444;">Se você não realizou esta ação, contate o administrador imediatamente.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SIS DAVUS. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),
  "mfa-removed": (_) => ({
    subject: "Autenticação em Dois Fatores Removida - SIS DAVUS",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
             @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
            body { font-family: 'Sora', 'Segoe UI', sans-serif; background-color: #030405; color: #ededed; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #0d0f11; border: 1px solid #1f2226; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); }
            .header { background: #16181b; padding: 32px; text-align: center; border-bottom: 1px solid #1f2226; }
            .logo { font-size: 24px; font-weight: 700; color: #ededed; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; }
            .logo span { color: #ff5d38; }
            .content { padding: 40px 32px; text-align: center; }
            .alert-box { background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 32px; border-radius: 4px; text-align: left; }
            .alert-title { color: #ef4444; font-weight: 600; margin-bottom: 4px; display: block; }
            .alert-text { color: #fca5a5; font-size: 14px; margin: 0; }
            h2 { color: #ffffff; font-size: 24px; margin: 0 0 24px; }
            p { line-height: 1.6; margin-bottom: 24px; color: #a1a1aa; font-size: 16px; }
            .footer { background: #16181b; padding: 24px; text-align: center; font-size: 12px; color: #52525b; border-top: 1px solid #1f2226; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SIS <span>DAVUS</span></div>
            </div>
            <div class="content">
              <h2>2FA Removido</h2>
              <div class="alert-box">
                <span class="alert-title">Atenção</span>
                <p class="alert-text">Um método de autenticação foi removido da sua conta.</p>
              </div>
              <p>Sua conta está menos segura agora.</p>
              <p>Se você não removeu o 2FA, sua conta pode estar em risco. Contate o suporte.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SIS DAVUS. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),
  "new-device-login": (data) => ({
    subject: "Novo Acesso Detectado - SIS DAVUS",
    html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
               @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
              body { font-family: 'Sora', 'Segoe UI', sans-serif; background-color: #030405; color: #ededed; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 40px auto; background: #0d0f11; border: 1px solid #1f2226; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); }
              .header { background: #16181b; padding: 32px; text-align: center; border-bottom: 1px solid #1f2226; }
              .logo { font-size: 24px; font-weight: 700; color: #ededed; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; }
              .logo span { color: #ff5d38; }
              .content { padding: 40px 32px; }
              .info-grid { display: grid; grid-template-columns: 1fr; gap: 16px; background: #16181b; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #1f2226; }
              .info-item { display: flex; flex-direction: column; }
              .info-label { font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
              .info-value { font-size: 16px; color: #ededed; font-weight: 500; }
              h2 { color: #ffffff; font-size: 24px; margin: 0 0 24px; text-align: center; }
              p { line-height: 1.6; margin-bottom: 24px; color: #a1a1aa; font-size: 16px; text-align: center; }
              .footer { background: #16181b; padding: 24px; text-align: center; font-size: 12px; color: #52525b; border-top: 1px solid #1f2226; }
              .btn { display: block; width: fit-content; margin: 32px auto; background-color: #ff5d38; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">SIS <span>DAVUS</span></div>
              </div>
              <div class="content">
                <h2>Novo Acesso Detectado</h2>
                <p>Detectamos um login na sua conta vindo de um dispositivo ou local inédito.</p>
                
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Dispositivo</span>
                    <span class="info-value">${data.device_info || 'Desconhecido'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Endereço IP</span>
                    <span class="info-value">${data.ip_address}</span>
                  </div>
                   <div class="info-item">
                    <span class="info-label">Localização</span>
                    <span class="info-value">${data.location || 'Desconhecida'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Horário</span>
                    <span class="info-value">${data.time}</span>
                  </div>
                </div>

                <p><strong>Se foi você, não é necessário fazer nada.</strong></p>
                <p style="color: #ef4444;">Se não foi você, recomendamos que altere sua senha imediatamente.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} SIS DAVUS. Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `
  }),
  "invite-user": (data) => ({
    subject: "Bem-vindo ao SIS DAVUS - Seu Acesso",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
             @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
            body { font-family: 'Sora', 'Segoe UI', sans-serif; background-color: #030405; color: #ededed; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #0d0f11; border: 1px solid #1f2226; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); }
            .header { background: #16181b; padding: 32px; text-align: center; border-bottom: 1px solid #1f2226; }
            .logo { font-size: 24px; font-weight: 700; color: #ededed; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; }
            .logo span { color: #ff5d38; }
            .content { padding: 40px 32px; }
            .highlight-box { background: #1f2937; border: 1px solid #374151; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center; }
            .highlight-label { font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: block; }
            .highlight-value { font-size: 20px; color: #ffffff; font-family: monospace; font-weight: 600; letter-spacing: 0.5px; }
            .divider { height: 1px; background: #374151; margin: 16px 0; }
            h2 { color: #ffffff; font-size: 24px; margin: 0 0 24px; text-align: center; }
            p { line-height: 1.6; margin-bottom: 24px; color: #a1a1aa; font-size: 16px; text-align: center; }
            .footer { background: #16181b; padding: 24px; text-align: center; font-size: 12px; color: #52525b; border-top: 1px solid #1f2226; }
            .btn { display: block; width: fit-content; margin: 32px auto; background-color: #ff5d38; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SIS <span>DAVUS</span></div>
            </div>
            <div class="content">
              <h2>Bem-vindo ao Sistema</h2>
              <p>Olá, <strong>${data.name}</strong>!</p>
              <p>Uma conta foi criada para você no sistema SIS Davus. Abaixo estão suas credenciais de acesso temporárias.</p>
              
              <div class="highlight-box">
                <span class="highlight-label">E-mail</span>
                <div class="highlight-value">${data.email}</div>
                <div class="divider"></div>
                <span class="highlight-label">Senha Temporária</span>
                <div class="highlight-value">${data.password}</div>
              </div>

              <p>Recomendamos que você altere sua senha imediatamente após o primeiro login.</p>
              
              <a href="${data.login_url || 'https://sis.davusengenharia.com.br'}" class="btn">Acessar Sistema</a>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SIS DAVUS. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `
  })
};

