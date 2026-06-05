import React from "react";
import { ShieldCheck, Bell, Tag, X, Lightbulb } from "lucide-react";

export default function PainelAvisos(props) {
  var avisos = props.avisos || {};
  var garantias = avisos.garantias || [];
  var onFechar = props.onFechar;
  var onAbrirTaloes = props.onAbrirTaloes;

  return (
    <div
      onClick={onFechar}
      style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(15,23,42,0.4)", display:"flex", flexDirection:"column" }}
    >
      <div
        onClick={function(e){ e.stopPropagation(); }}
        style={{ marginTop:"auto", background:"#f8fafc", borderTopLeftRadius:"24px", borderTopRightRadius:"24px", maxHeight:"80vh", overflowY:"auto" }}
      >
        <div style={{ position:"sticky", top:0, background:"#fff", borderBottom:"1px solid #f1f5f9", padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderTopLeftRadius:"24px", borderTopRightRadius:"24px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <Bell size={18} color="#2563eb" />
            <p style={{ fontSize:"16px", fontWeight:900, color:"#0f172a", margin:0 }}>Avisos</p>
          </div>
          <button onClick={onFechar} style={{ width:"32px", height:"32px", borderRadius:"12px", background:"#f1f5f9", border:"none", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={16} color="#64748b" />
          </button>
        </div>

        <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:"12px" }}>

          {garantias.map(function(g, i){
            return (
              <button
                key={"garantia-" + i}
                onClick={onAbrirTaloes}
                style={{ width:"100%", textAlign:"left", background:"#fff", borderRadius:"16px", padding:"16px", border:"1px solid #f1f5f9", display:"flex", alignItems:"center", gap:"12px", cursor:"pointer" }}
              >
                <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:"#fef3c7", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <ShieldCheck size={20} color="#d97706" />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:"10px", fontWeight:900, color:"#d97706", textTransform:"uppercase", letterSpacing:"0.05em", margin:0 }}>Garantia a terminar</p>
                  <p style={{ fontSize:"14px", fontWeight:900, color:"#1e293b", margin:"2px 0 0 0", lineHeight:1.2 }}>{g.produto}</p>
                  <p style={{ fontSize:"11px", color:"#94a3b8", margin:"2px 0 0 0" }}>{g.restam === 0 ? "Acaba hoje" : "Acaba daqui a " + g.restam + " dias"}</p>
                </div>
              </button>
            );
          })}

          <div style={{ background:"linear-gradient(135deg,#eff6ff,#eef2ff)", borderRadius:"16px", padding:"16px", border:"1px solid #dbeafe", display:"flex", gap:"12px" }}>
            <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:"#dbeafe", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Lightbulb size={18} color="#2563eb" />
            </div>
            <div>
              <p style={{ fontSize:"10px", fontWeight:900, color:"#2563eb", textTransform:"uppercase", letterSpacing:"0.05em", margin:0 }}>Dica</p>
              <p style={{ fontSize:"14px", fontWeight:700, color:"#1e293b", margin:"2px 0 0 0", lineHeight:1.3 }}>Compara os folhetos antes de ir às compras e poupa nos artigos da semana.</p>
            </div>
          </div>

          <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", border:"1px solid #f1f5f9", display:"flex", gap:"12px" }}>
            <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:"#ecfdf5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Tag size={18} color="#059669" />
            </div>
            <div>
              <p style={{ fontSize:"10px", fontWeight:900, color:"#059669", textTransform:"uppercase", letterSpacing:"0.05em", margin:0 }}>Novidade</p>
              <p style={{ fontSize:"14px", fontWeight:700, color:"#1e293b", margin:"2px 0 0 0", lineHeight:1.3 }}>Já podes guardar os teus talões de compras e garantias na secção "Os meus talões".</p>
            </div>
          </div>

          {garantias.length === 0 && (
            <div style={{ background:"#fff", borderRadius:"16px", padding:"20px", border:"1px solid #f1f5f9", textAlign:"center" }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:"8px" }}>
                <ShieldCheck size={28} color="#cbd5e1" />
              </div>
              <p style={{ fontSize:"14px", fontWeight:700, color:"#64748b", margin:0 }}>Sem garantias a terminar</p>
              <p style={{ fontSize:"11px", color:"#94a3b8", margin:"2px 0 0 0" }}>Avisamos-te quando alguma estiver perto do fim.</p>
            </div>
          )}

          <p style={{ fontSize:"10px", color:"#cbd5e1", textAlign:"center", margin:"4px 0 8px 0" }}>Os avisos chegam quando abres a app. Notificações automáticas virão com a app instalável.</p>

        </div>
      </div>
    </div>
  );
}
