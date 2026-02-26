import React, { forwardRef } from "react";
import { numberToBRL } from "@/utils/currency";

interface OSPrintTemplateProps {
  osData: any;
  itens: any[];
  totais: any;
  companyLogo: string | null;
}

export const OSPrintTemplate = forwardRef<HTMLDivElement, OSPrintTemplateProps>(
  ({ osData, itens, totais, companyLogo }, ref) => {
    return (
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
        <div 
          ref={ref}
          style={{ 
            width: '816px', minHeight: '1056px', padding: '40px',
            backgroundColor: 'white', fontFamily: 'sans-serif',
            color: '#1e293b', boxSizing: 'border-box'
          }}
        >
          {/* HEADER */}
          <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {companyLogo ? (
                <img src={companyLogo} alt="Logo" style={{ height: '45px', marginBottom: '5px' }} />
              ) : (
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#4f46e5', margin: 0 }}>ORDEM DE SERVIÇO</h1>
              )}
              <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>Emissão: {osData.dataEmissao}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ background: '#f1f5f9', padding: '5px 15px', borderRadius: '6px' }}>
                <p style={{ fontSize: '14px', fontWeight: '800', margin: 0 }}>
                  {osData._id ? `OS Nº ${osData.numero}` : "Rascunho de OS"}
                </p>
                <p style={{ fontSize: '9px', fontWeight: '700', color: '#4f46e5', margin: 0, textTransform: 'uppercase' }}>{osData.status}</p>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2 E 3: CLIENTE E EQUIPAMENTO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
              <h4 style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>Dados do Cliente</h4>
              <p style={{ fontSize: '11px', margin: '3px 0' }}><strong>Nome:</strong> {osData.cliente}</p>
              <p style={{ fontSize: '11px', margin: '3px 0' }}><strong>CPF/CNPJ:</strong> {osData.documento}</p>
              <p style={{ fontSize: '11px', margin: '3px 0' }}><strong>Contato:</strong> {osData.contato}</p>
              <p style={{ fontSize: '11px', margin: '3px 0', lineHeight: '1.4' }}>
                <strong>Endereço:</strong> {`
                  ${osData.endereco.street}, ${osData.endereco.number} 
                  ${osData.endereco.complement ? ` - ${osData.endereco.complement}` : ''} 
                  - ${osData.endereco.neighborhood}, ${osData.endereco.city}/${osData.endereco.uf} 
                  - CEP: ${osData.endereco.cep}
                `}
              </p>
              {osData.customFields.cliente.map((f: any) => (
                <p key={f.id} style={{ fontSize: '11px', margin: '3px 0' }}><strong>{f.label}:</strong> {f.value}</p>
              ))}
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
              <h4 style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>Dados do Equipamento</h4>
              <p style={{ fontSize: '11px', margin: '3px 0' }}><strong>Aparelho:</strong> {osData.equipamento}</p>
              <p style={{ fontSize: '11px', margin: '3px 0' }}><strong>Marca/Modelo:</strong> {osData.marcaModelo}</p>
              <p style={{ fontSize: '11px', margin: '3px 0' }}><strong>Nº Série/IMEI:</strong> {osData.serialIMEI}</p>
              <p style={{ fontSize: '11px', margin: '3px 0' }}><strong>Acessórios:</strong> {osData.acessorios}</p>
              {osData.customFields.equipamento.map((f: any) => (
                <p key={f.id} style={{ fontSize: '11px', margin: '3px 0' }}><strong>{f.label}:</strong> {f.value}</p>
              ))}
            </div>
          </div>

          {/* CHECKLIST VISUAL */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748b', marginBottom: '5px' }}>Checklist / Estado Geral</h4>
            <p style={{ fontSize: '10px', color: '#334155', margin: 0, fontStyle: 'italic' }}>{osData.checklist || "Não informado."}</p>
          </div>

          {/* DIAGNÓSTICO E SERVIÇO */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '20px', background: '#f8fafc' }}>
            <div style={{ marginBottom: '10px' }}>
              <h4 style={{ fontSize: '9px', textTransform: 'uppercase', color: '#ef4444', marginBottom: '3px' }}>Defeito Relatado</h4>
              <p style={{ fontSize: '11px', margin: 0 }}>{osData.defeitoRelatado}</p>
            </div>
            <div>
              <h4 style={{ fontSize: '9px', textTransform: 'uppercase', color: '#3b82f6', marginBottom: '3px' }}>Diagnóstico Técnico / Serviço Executado</h4>
              <p style={{ fontSize: '11px', margin: 0 }}>{osData.diagnosticoTecnico}</p>
            </div>
            {osData.customFields.servico.map((f: any) => (
                <p key={f.id} style={{ fontSize: '11px', margin: '5px 0 0 0' }}><strong>{f.label}:</strong> {f.value}</p>
            ))}
          </div>

          {/* TABELA DE PEÇAS/INSUMOS */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#4f46e5', color: 'white' }}>
                <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', borderRadius: '4px 0 0 0' }}>DESCRIÇÃO DA PEÇA / PRODUTO</th>
                <th style={{ padding: '8px', textAlign: 'center', fontSize: '10px', width: '60px' }}>QTD</th>
                <th style={{ padding: '8px', textAlign: 'right', fontSize: '10px', borderRadius: '0 4px 0 0', width: '100px' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {itens.filter(item => item.produto && item.produto.trim() !== "").map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px', fontSize: '11px' }}>{item.produto || "Item não selecionado"}</td>
                  <td style={{ padding: '8px', fontSize: '11px', textAlign: 'center' }}>{item.qtd}</td>
                  <td style={{ padding: '8px', fontSize: '11px', textAlign: 'right' }}>{numberToBRL(item.qtd * Number(item.preco || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTAIS E PAGAMENTO */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ width: '60%' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748b', marginBottom: '5px' }}>Termos de Garantia</h4>
                <p style={{ fontSize: '9px', margin: 0, lineHeight: '1.4' }}>{osData.termosGarantia}</p>
              </div>
              <div style={{ fontSize: '10px' }}>
                <p><strong>Forma de Pagamento:</strong> {osData.pagamento}</p>
                <p><strong>Entrada:</strong> {osData.dataDeixouEqp}</p>
                <p><strong>Previsão Retirada:</strong> {osData.dataPrevistaParaRetirada}</p>
                <p><strong>Retirada Realizada:</strong> {osData.dataRetirouEqp}</p>
                <p><strong>Técnico Responsável:</strong> {osData.tecnicoResponsavel}</p>
              </div>
            </div>

            <div style={{ width: '35%', textAlign: 'right' }}>
              <p style={{ fontSize: '11px', margin: '4px 0' }}>Total Peças: {numberToBRL(totais.subtotalPeças)}</p>
              <p style={{ fontSize: '11px', margin: '4px 0' }}>Mão de Obra: {numberToBRL(osData.valorMaoDeObra)}</p>
              <p style={{ fontSize: '11px', margin: '4px 0' }}>Outros/Frete:  {numberToBRL(osData.frete)}</p>
              <p style={{ fontSize: '11px', margin: '4px 0', color: '#ef4444' }}>Desconto ({osData.desconto}%): - {numberToBRL(totais.subtotalGeral * (Number(osData.desconto)/100))}</p>
              <div style={{ borderTop: '2px solid #4f46e5', marginTop: '10px', paddingTop: '10px' }}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>Valor Total da OS</p>
                <p style={{ fontSize: '22px', fontWeight: '900', color: '#4f46e5', margin: 0 }}>{numberToBRL(totais.total)}</p>
              </div>
            </div>
          </div>

          {/* ASSINATURAS */}
          <div style={{ marginTop: '50px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div style={{ textAlign: 'center', borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
              <p style={{ fontSize: '10px', margin: 0 }}>{osData.cliente}</p>
              <p style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase' }}>Assinatura do Cliente</p>
            </div>
            <div style={{ textAlign: 'center', borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
              <p style={{ fontSize: '10px', margin: 0 }}>Responsável Técnico</p>
              <p style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase' }}>Assinatura da Empresa</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);