---
impacto: nada_mudou
secao: corrigido
titulo: "Pausar abordagens" na Prospecção deixa de travar 30 segundos com a lista aberta
---

Com uma campanha em andamento, a tela da Prospecção relê a lista a cada 10
segundos, e essa leitura é pesada. O cliente desistia aos 10 s e repetia, e o
servidor terminava todas as repetições, ocupando as conexões do banco. O
"Pausar abordagens" ficava na fila atrás delas e a tela mostrava "A requisição
não respondeu em 30000ms", sem dizer se a campanha tinha pausado.

Agora a leitura da lista espera até 45 s sem repetir, e o "Pausar" usa uma
conexão própria com espera curta: sem vaga em poucos segundos ele responde que
o banco está ocupado e pode ser repetido. Repetir um "Pausar" que já tinha
chegado ao banco conta como pausado, em vez de responder "campanha não
encontrada". Nenhuma ação é necessária na atualização.
