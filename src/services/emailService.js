// src/services/emailService.js
import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.testAccount = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Criar conta de teste no Ethereal Email
      this.testAccount = await nodemailer.createTestAccount();
      
      // Criar transporter com configurações do Ethereal
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true para 465, false para outras portas
        auth: {
          user: this.testAccount.user,
          pass: this.testAccount.pass,
        },
      });

      console.log('✅ Serviço de email inicializado');
      console.log(`📧 Conta de teste: ${this.testAccount.user}`);
      console.log(`🔑 Senha: ${this.testAccount.pass}`);
      console.log('🌐 Visualize emails em: https://ethereal.email');
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de email:', error);
    }
  }

  // Template de email para criação de conta
  getWelcomeEmailTemplate(userName, userEmail) {
    return {
      subject: '🎉 Bem-vindo ao VPE - Conta Criada com Sucesso!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #007BFF, #0056b3);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .welcome-box {
              background: white;
              padding: 25px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #27ae60;
            }
            .info-box {
              background: #e3f2fd;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #27ae60, #229954);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
            }
            .features {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .feature-item {
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .feature-item:last-child {
              border-bottom: none;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 14px;
            }
            .emoji {
              font-size: 24px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Bem-vindo ao VPE!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Sua conta foi criada com sucesso</p>
          </div>
          
          <div class="content">
            <div class="welcome-box">
              <h2 style="color: #27ae60; margin-top: 0;">Olá, ${userName}!</h2>
              <p style="font-size: 16px;">
                É um prazer ter você conosco! Sua conta foi criada com sucesso e você já pode começar a explorar 
                todas as oportunidades de investimento disponíveis na plataforma VPE.
              </p>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">📋 Suas Informações de Acesso</h3>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p style="margin-bottom: 0;"><strong>Data de Cadastro:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>

            <div style="text-align: center;">
              <a href="http://localhost:3000/lista_empresas.html" class="button">
                🚀 Começar a Explorar Empresas
              </a>
            </div>

            <div class="features">
              <h3 style="margin-top: 0; color: #007BFF;">✨ O que você pode fazer no VPE:</h3>
              
              <div class="feature-item">
                <span class="emoji">🏢</span>
                <strong> Explorar Empresas</strong>
                <p style="margin: 5px 0 0 0; color: #666;">
                  Navegue por centenas de empresas cadastradas e encontre oportunidades de investimento
                </p>
              </div>

              <div class="feature-item">
                <span class="emoji">❤️</span>
                <strong> Favoritar Empresas</strong>
                <p style="margin: 5px 0 0 0; color: #666;">
                  Salve suas empresas favoritas para acompanhar de perto
                </p>
              </div>

              <div class="feature-item">
                <span class="emoji">📊</span>
                <strong> Ver Dados Financeiros</strong>
                <p style="margin: 5px 0 0 0; color: #666;">
                  Acesse informações detalhadas sobre o desempenho financeiro das empresas
                </p>
              </div>

              <div class="feature-item">
                <span class="emoji">🎯</span>
                <strong> Cadastrar Sua Empresa</strong>
                <p style="margin: 5px 0 0 0; color: #666;">
                  Você também pode cadastrar sua própria empresa e atrair investidores
                </p>
              </div>
            </div>

            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
              <h4 style="margin-top: 0; color: #856404;">💡 Dica Importante</h4>
              <p style="margin-bottom: 0; color: #856404;">
                Mantenha seus dados sempre atualizados para receber as melhores oportunidades de investimento 
                e se conectar com empresas que combinam com seu perfil!
              </p>
            </div>
          </div>

          <div class="footer">
            <p><strong>VPE - Conectando Investidores e Empresas</strong></p>
            <p style="font-size: 12px; color: #999;">
              Este é um email automático, por favor não responda.<br>
              Em caso de dúvidas, entre em contato através do nosso suporte.
            </p>
            <p style="font-size: 12px; color: #999;">
              © 2024 VPE. Todos os direitos reservados.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Bem-vindo ao VPE, ${userName}!
        
        Sua conta foi criada com sucesso!
        
        Email: ${userEmail}
        Data de Cadastro: ${new Date().toLocaleDateString('pt-BR')}
        
        Acesse a plataforma em: http://localhost:3000/lista_empresas.html
        
        O que você pode fazer:
        - Explorar empresas cadastradas
        - Favoritar empresas interessantes
        - Ver dados financeiros detalhados
        - Cadastrar sua própria empresa
        
        VPE - Conectando Investidores e Empresas
      `
    };
  }

  // Template de email para nova empresa cadastrada
  getNewCompanyEmailTemplate(companyName, companyData, userName) {
    return {
      subject: `🏢 Nova Empresa Cadastrada: ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #27ae60, #229954);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .success-box {
              background: white;
              padding: 25px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #27ae60;
            }
            .company-card {
              background: white;
              padding: 25px;
              border-radius: 8px;
              margin: 20px 0;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .company-img {
              width: 100%;
              max-width: 400px;
              height: 200px;
              object-fit: cover;
              border-radius: 8px;
              margin: 15px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .badge {
              display: inline-block;
              padding: 5px 12px;
              background: #e3f2fd;
              color: #007BFF;
              border-radius: 15px;
              font-size: 14px;
              font-weight: bold;
            }
            .price {
              font-size: 24px;
              color: #27ae60;
              font-weight: bold;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #007BFF, #0056b3);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
            }
            .next-steps {
              background: #e8f5e9;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #27ae60;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏢 Empresa Cadastrada!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Sua empresa foi publicada com sucesso</p>
          </div>
          
          <div class="content">
            <div class="success-box">
              <h2 style="color: #27ae60; margin-top: 0;">✅ Parabéns, ${userName}!</h2>
              <p style="font-size: 16px;">
                Sua empresa <strong>${companyName}</strong> foi cadastrada com sucesso na plataforma VPE 
                e já está disponível para investidores visualizarem!
              </p>
            </div>

            <div class="company-card">
              <h3 style="margin-top: 0; color: #333;">📋 Detalhes da Empresa</h3>
              
              ${companyData.img ? `<img src="${companyData.img}" alt="${companyName}" class="company-img">` : ''}
              
              <h2 style="color: #007BFF; margin: 15px 0 10px 0;">${companyName}</h2>
              
              <p style="color: #666; line-height: 1.6;">
                ${companyData.descricao || 'Descrição não disponível'}
              </p>

              <div style="margin: 20px 0;">
                <div class="info-row">
                  <span><strong>💰 Investimento Buscado:</strong></span>
                  <span class="price">R$ ${parseFloat(companyData.preco).toLocaleString('pt-BR')}</span>
                </div>
                
                <div class="info-row">
                  <span><strong>🏷️ Setor:</strong></span>
                  <span class="badge">${companyData.setor || 'Outros'}</span>
                </div>
                
                <div class="info-row">
                  <span><strong>📅 Data de Cadastro:</strong></span>
                  <span>${new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="http://localhost:3000/dados_financeiros.html?empresa=${encodeURIComponent(companyName)}" class="button">
                📊 Ver Página da Empresa
              </a>
            </div>

            <div class="next-steps">
              <h3 style="margin-top: 0; color: #27ae60;">🎯 Próximos Passos</h3>
              
              <p><strong>1. Adicione Dados Financeiros</strong></p>
              <p style="margin: 5px 0 15px 0; color: #666;">
                Empresas com dados financeiros completos atraem 3x mais investidores! 
                Adicione seus faturamentos mensais.
              </p>

              <p><strong>2. Mantenha as Informações Atualizadas</strong></p>
              <p style="margin: 5px 0 15px 0; color: #666;">
                Atualize regularmente os dados da sua empresa para manter investidores informados.
              </p>

              <p><strong>3. Responda às Solicitações</strong></p>
              <p style="margin: 5px 0 0 0; color: #666;">
                Fique atento aos investidores interessados e responda prontamente às solicitações.
              </p>
            </div>

            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
              <h4 style="margin-top: 0; color: #856404;">💡 Dica para Atrair Investidores</h4>
              <p style="margin-bottom: 0; color: #856404;">
                Empresas com descrições detalhadas, imagens de qualidade e dados financeiros completos 
                têm <strong>5x mais chances</strong> de receberem propostas de investimento!
              </p>
            </div>
          </div>

          <div class="footer">
            <p><strong>VPE - Conectando Investidores e Empresas</strong></p>
            <p style="font-size: 12px; color: #999;">
              Este é um email automático, por favor não responda.<br>
              Em caso de dúvidas, entre em contato através do nosso suporte.
            </p>
            <p style="font-size: 12px; color: #999;">
              © 2024 VPE. Todos os direitos reservados.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Empresa Cadastrada com Sucesso!
        
        Parabéns, ${userName}!
        
        Sua empresa ${companyName} foi cadastrada e já está disponível na plataforma.
        
        Detalhes:
        - Investimento Buscado: R$ ${parseFloat(companyData.preco).toLocaleString('pt-BR')}
        - Setor: ${companyData.setor || 'Outros'}
        - Data: ${new Date().toLocaleDateString('pt-BR')}
        
        Próximos Passos:
        1. Adicione dados financeiros
        2. Mantenha informações atualizadas
        3. Responda às solicitações de investidores
        
        Acesse: http://localhost:3000/dados_financeiros.html?empresa=${encodeURIComponent(companyName)}
        
        VPE - Conectando Investidores e Empresas
      `
    };
  }

  // Enviar email de boas-vindas
  async sendWelcomeEmail(userEmail, userName) {
    try {
      if (!this.transporter) {
        await this.initialize();
      }

      const emailTemplate = this.getWelcomeEmailTemplate(userName, userEmail);

      const info = await this.transporter.sendMail({
        from: '"VPE - Plataforma de Investimentos" <noreply@vpe.com>',
        to: userEmail,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      });

      console.log('✅ Email de boas-vindas enviado:', info.messageId);
      console.log('🔗 Visualizar email:', nodemailer.getTestMessageUrl(info));

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } catch (error) {
      console.error('❌ Erro ao enviar email de boas-vindas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar email de nova empresa
  async sendNewCompanyEmail(userEmail, userName, companyName, companyData) {
    try {
      if (!this.transporter) {
        await this.initialize();
      }

      const emailTemplate = this.getNewCompanyEmailTemplate(companyName, companyData, userName);

      const info = await this.transporter.sendMail({
        from: '"VPE - Plataforma de Investimentos" <noreply@vpe.com>',
        to: userEmail,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      });

      console.log('✅ Email de nova empresa enviado:', info.messageId);
      console.log('🔗 Visualizar email:', nodemailer.getTestMessageUrl(info));

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } catch (error) {
      console.error('❌ Erro ao enviar email de nova empresa:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar email de notificação para admin
  async sendAdminNotification(adminEmail, subject, message) {
    try {
      if (!this.transporter) {
        await this.initialize();
      }

      const info = await this.transporter.sendMail({
        from: '"VPE Sistema" <system@vpe.com>',
        to: adminEmail,
        subject: `[VPE Admin] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #007BFF;">Notificação do Sistema VPE</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              ${message}
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Sistema VPE - ${new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        `,
        text: message
      });

      console.log('✅ Notificação admin enviada:', info.messageId);

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } catch (error) {
      console.error('❌ Erro ao enviar notificação admin:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Exportar instância única do serviço
export default new EmailService();