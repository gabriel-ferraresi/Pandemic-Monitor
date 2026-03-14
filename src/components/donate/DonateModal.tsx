import { useState, useCallback } from "react";
import { X, Heart } from "lucide-react";
import { cn } from "../../utils";
import { ValueSelector } from "./ValueSelector";
import { PaymentMethodSelector, type PaymentMethod } from "./PaymentMethodSelector";
import { PixPayment } from "./PixPayment";
import { CardPayment } from "./CardPayment";
import { CryptoPayment } from "./CryptoPayment";
import { DonationSuccess } from "./DonationSuccess";

type Step = 'select' | 'payment' | 'success';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

export function DonateModal({ isOpen, onClose, isMobile }: DonateModalProps) {
  const [step, setStep] = useState<Step>('select');
  const [amount, setAmount] = useState(25);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [donorName, setDonorName] = useState('');
  const [donorMessage, setDonorMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = useCallback(() => {
    setStep('select');
    setAmount(25);
    setMethod(null);
    setDonorName('');
    setDonorMessage('');
    setIsAnonymous(true);
    setErrorMsg('');
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [onClose, handleReset]);

  const handleSuccess = useCallback(() => {
    setStep('success');
  }, []);

  const handleError = useCallback((msg: string) => {
    setErrorMsg(msg);
  }, []);

  const canProceed = method !== null && (method === 'crypto' || amount >= 5);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={cn(
        "relative bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden",
        isMobile
          ? "w-full h-full rounded-none"
          : "w-full max-w-md rounded-2xl max-h-[90vh]"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
              <Heart className="w-4 h-4 text-emerald-500 fill-emerald-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                Apoiar Projeto
              </h2>
              <p className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
                Pandemic Monitor
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className={cn(
          "overflow-y-auto p-5",
          isMobile ? "max-h-[calc(100dvh-72px)]" : "max-h-[calc(90vh-72px)]"
        )}>
          {step === 'success' ? (
            <DonationSuccess onClose={handleClose} isMobile={isMobile} />
          ) : step === 'payment' && method ? (
            <div className="space-y-4">
              {/* Botão voltar */}
              <button
                onClick={() => { setStep('select'); setErrorMsg(''); }}
                className="text-xs text-slate-500 dark:text-zinc-500 hover:text-emerald-500 font-mono transition-colors"
              >
                ← Voltar
              </button>

              {method === 'pix' && (
                <PixPayment
                  amount={amount}
                  donorName={donorName || undefined}
                  donorMessage={donorMessage || undefined}
                  isAnonymous={isAnonymous}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  isMobile={isMobile}
                />
              )}
              {method === 'card' && (
                <CardPayment
                  amount={amount}
                  donorName={donorName || undefined}
                  donorMessage={donorMessage || undefined}
                  isAnonymous={isAnonymous}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  isMobile={isMobile}
                />
              )}
              {method === 'crypto' && (
                <CryptoPayment
                  donorName={donorName || undefined}
                  donorMessage={donorMessage || undefined}
                  isAnonymous={isAnonymous}
                  onSuccess={handleSuccess}
                  isMobile={isMobile}
                />
              )}
            </div>
          ) : (
            /* Etapa de seleção */
            <div className="space-y-5">
              {/* Mensagem emocional */}
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  O Pandemic Monitor é mantido por <span className="font-bold text-emerald-600 dark:text-emerald-400">doações voluntárias</span>.
                  Seu apoio sustenta os servidores, a IA e a pesquisa epidemiológica para o mundo inteiro. 💚
                </p>
              </div>

              {/* Método de pagamento */}
              <PaymentMethodSelector
                selected={method}
                onSelect={setMethod}
                isMobile={isMobile}
              />

              {/* Valor (apenas para PIX e Cartão) */}
              {method && method !== 'crypto' && (
                <ValueSelector
                  value={amount}
                  onChange={setAmount}
                  isMobile={isMobile}
                />
              )}

              {/* Dados do doador */}
              {method && (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-500 block">
                    Informações do apoiador (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Seu nome (para o mural de apoiadores)"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    maxLength={60}
                    className="w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-white/5 text-slate-800 dark:text-white text-sm outline-none transition-all border-slate-200 dark:border-white/10 focus:border-emerald-500/50 placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                  />
                  <textarea
                    placeholder="Deixe uma mensagem (opcional)"
                    value={donorMessage}
                    onChange={(e) => setDonorMessage(e.target.value)}
                    maxLength={200}
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-white/5 text-slate-800 dark:text-white text-sm outline-none transition-all border-slate-200 dark:border-white/10 focus:border-emerald-500/50 placeholder:text-slate-400 dark:placeholder:text-zinc-600 resize-none"
                  />

                  {/* Toggle anonimato */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-all relative",
                        isAnonymous
                          ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                          : "bg-slate-300 dark:bg-white/20"
                      )}
                    >
                      <div className={cn(
                        "absolute w-4 h-4 rounded-full bg-white top-0.5 transition-all shadow-sm",
                        isAnonymous ? "left-[22px]" : "left-0.5"
                      )} />
                    </button>
                    <span className="text-xs text-slate-600 dark:text-zinc-400">
                      Aparecer como anônimo no mural
                    </span>
                  </label>
                </div>
              )}

              {/* Erro */}
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-500 font-mono">
                  {errorMsg}
                </div>
              )}

              {/* Botão prosseguir */}
              {method && (
                <button
                  onClick={() => { setErrorMsg(''); setStep('payment'); }}
                  disabled={!canProceed}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold text-sm transition-all",
                    canProceed
                      ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                      : "bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
                  )}
                >
                  {method === 'crypto' ? 'Ver endereços de carteira' : `Doar R$ ${amount.toFixed(2)}`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
