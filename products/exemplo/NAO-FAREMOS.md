# Não faremos — produto exemplo

Este arquivo documenta o que este produto **nunca** fará.
Serve de cerca para o time e de lembrete para futuras extensões.

Substitua os itens abaixo pelas restrições reais do seu produto.

---

- **Não usa IA na regra.** O veredito é determinístico: dados de entrada + relógio = resultado. Nenhum modelo de linguagem entra na `rule.ts`.
- **Não estende prazo por simpatia.** Prazo vencido sem critério atingido é rejeição automática.
- **Não reabre um caso rejeitado sem evidência nova.** "Mudei de ideia" não é evidência.
- **Não armazena dados do usuário fora do log de casos.** Toda evidência vai ao bucket R2 privado, nunca num banco público.
