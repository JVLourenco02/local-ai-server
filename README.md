# Local AI Server

Projeto de estudo para executar um modelo de inteligência artificial localmente e disponibilizá-lo por meio de uma API própria.

## Objetivo

Construir um servidor de IA local utilizando Linux, Python, FastAPI e Ollama, permitindo que outros dispositivos da rede local enviem perguntas e recebam respostas sem depender de uma API de IA hospedada na nuvem.

## Hardware

- **Computador:** Lenovo ThinkCentre M720q Tiny
- **Processador:** Intel Core i5-9400T
- **Memória RAM:** 16 GB DDR4
- **Armazenamento:** SSD NVMe de 256 GB
- **Gráficos:** Intel UHD Graphics 630, integrada

## Tecnologias

- Ubuntu Server 26.04.1 LTS
- Python
- FastAPI
- Uvicorn
- HTTPX
- Ollama
- Llama 3.2

## Arquitetura

O usuário envia uma requisição pelo navegador ou por outro cliente. A API desenvolvida em FastAPI recebe a mensagem, encaminha a solicitação ao Ollama e devolve a resposta gerada pelo modelo local.

## Funcionalidades implementadas

- [x] Instalação e configuração do servidor Linux
- [x] Execução local do modelo Llama 3.2 com Ollama
- [x] Criação da API com FastAPI
- [x] Endpoint de verificação do serviço
- [x] Endpoint para enviar mensagens à IA
- [x] Teste da API pela documentação interativa do FastAPI

## Próximas etapas

- [ ] Desenvolver uma interface web própria com HTML, CSS e JavaScript
- [ ] Implementar histórico de conversas com SQLite
- [ ] Medir o tempo de resposta e o uso de recursos
- [ ] Melhorar o tratamento de erros
- [ ] Documentar os testes e os resultados obtidos

## Execução local

Crie e ative um ambiente virtual Python, instale as dependências e inicie a API:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

A documentação interativa estará disponível em:

`http://IP_DO_SERVIDOR:8000/docs`

O Ollama também precisa estar instalado e com o modelo `llama3.2` disponível.

## Segurança

O projeto está sendo desenvolvido para uso em uma rede local confiável. Não exponha a API diretamente à internet sem implementar autenticação, controles de acesso e medidas adicionais de segurança.

## Status

Projeto em desenvolvimento para fins educacionais e de construção de portfólio.


## Benchmark inicial de desempenho

Foi realizado um teste preliminar para comparar o tempo de resposta do modelo Llama 3.2 com o modelo descarregado e com o modelo já carregado na memória.

### Ambiente de teste

- **Servidor:** Lenovo ThinkCentre M720q Tiny
- **Processador:** Intel Core i5-9400T
- **Memória RAM:** 16 GB DDR4
- **GPU:** Intel UHD Graphics 630 integrada
- **Modelo:** Llama 3.2
- **Execução:** CPU, utilizando Ollama
- **Pergunta de teste:** "Quanto é 2 + 2? Responda apenas com o resultado."

### Resultados

| Situação | Tempo total |
|---|---:|
| Primeira chamada, modelo descarregado | 4,041 segundos |
| Segunda chamada, modelo carregado | 0,240 segundos |

A segunda chamada foi aproximadamente 16,8 vezes mais rápida, com uma redução de cerca de 94,1% no tempo total observado.

Na primeira chamada, o Ollama informou aproximadamente 3,332 segundos de carregamento do modelo. Na segunda, o carregamento levou aproximadamente 0,0012 segundo.

### Conclusão preliminar

Os resultados indicam que manter o modelo carregado na memória pode reduzir significativamente o tempo de resposta para solicitações curtas.

Este é um teste inicial, realizado com uma pergunta simples. Os resultados não representam o desempenho de todas as solicitações, pois o tempo também depende do tamanho da entrada, da quantidade de texto gerado e das condições de execução.

Novos testes serão realizados para avaliar perguntas mais longas e acompanhar a evolução do desempenho do servidor.


### Teste com uma pergunta mais elaborada

Foi realizado um segundo teste utilizando a interface web do Local AI Server. O objetivo foi observar o comportamento do sistema ao responder uma pergunta que exige uma explicação mais extensa.

**Pergunta utilizada:** solicitação para explicar o conceito de inteligência artificial local, suas vantagens em relação aos serviços de IA na nuvem e suas limitações em um computador sem placa de vídeo dedicada.

**Tempo observado:** aproximadamente 32 segundos.

**Comportamento da interface:** enquanto o modelo processava a solicitação, a página exibiu a mensagem "O Llama 3.2 está preparando uma resposta...". Após a conclusão do processamento, a resposta foi apresentada integralmente.

**Observação técnica:** este teste foi realizado antes da implementação do streaming. Atualmente, a interface web recebe e exibe a resposta gradualmente durante a geração do texto.

Este resultado é uma medição inicial, realizada manualmente. O tempo pode variar conforme o tamanho da pergunta, a extensão da resposta e as condições de execução.

### Próximas melhorias

- Medir o tempo de resposta de forma automática.
- Avaliar a geração de respostas em streaming.
- Comparar o desempenho de perguntas curtas e longas.
- Investigar estratégias para melhorar a experiência de uso.


## Respostas em streaming

A API foi atualizada para transmitir as respostas do modelo
Llama 3.2 progressivamente para a interface web.

### Implementação

- O Ollama gera a resposta em pequenos trechos.
- O FastAPI encaminha os trechos ao navegador.
- O JavaScript recebe os dados e atualiza a mensagem em tempo real.
- A interface permite acompanhar a resposta antes de sua geração terminar.

### Teste funcional

Foi realizado um teste pela interface web com a pergunta:

"Explique em três frases o que é um servidor de inteligência artificial local."

**Resultado:** o texto apareceu gradualmente e a resposta foi concluída
em aproximadamente 10 segundos.

O tempo registrado é uma observação manual para essa pergunta específica,
não uma medição padronizada de desempenho.

### Tecnologias utilizadas

- Python
- FastAPI
- HTTPX
- Ollama
- Llama 3.2
- HTML, CSS e JavaScript


## Monitoramento de recursos durante a inferência

Foi realizada uma coleta pontual de recursos enquanto o modelo Llama 3.2 era executado localmente no Lenovo ThinkCentre M720q Tiny.

### Resultado observado

| Métrica | Resultado |
|---|---:|
| Processo monitorado | `llama-server` |
| Uso de CPU no instante da coleta | 307% |
| Memória residente (RSS) | 2.527.908 KiB (aprox. 2,41 GiB) |
| Uso de memória reportado pelo Linux | 16,0% |
| Memória virtual (VSZ) | 3.225.424 KiB (aprox. 3,08 GiB) |

### Método

Os dados foram coletados com o comando `ps`, durante a geração de uma resposta do modelo:

```bash
ps -C llama-server -o pid,comm,%cpu,%mem,rss,vsz
```

### Observações

Os valores representam uma amostra pontual e podem variar conforme o modelo, o tamanho do prompt, o contexto e a etapa de geração. O RSS representa a memória residente do processo, não apenas os pesos do modelo. O VSZ representa memória virtual e não deve ser interpretado como consumo de RAM física.

O uso de CPU acima de 100% ocorre porque o Linux pode contabilizar o trabalho de múltiplos núcleos para um mesmo processo.

Esses resultados são preliminares e não substituem testes repetidos e controlados de desempenho.


### Benchmark automatizado com Ollama

Foi desenvolvido um script em Python para medir automaticamente o desempenho do modelo Llama 3.2 por meio da API do Ollama. O script registra os resultados em um arquivo JSONL local, permitindo manter um histórico das execuções.

**Configuração do teste:**
- **Modelo:** Llama 3.2
- **Prompt:** explicação breve sobre inteligência artificial local
- **Limite de geração:** 80 tokens
- **Temperatura:** 0
- **Método:** chamada HTTP à API do Ollama, sem streaming

#### Resultados

Foram realizadas três execuções com o mesmo prompt e a mesma configuração.

| Métrica | Modelo inicialmente descarregado | Modelo já carregado (média de 2 testes) |
|---|---:|---:|
| Tempo total de resposta | 7,361 s | 3,517 s |
| Tempo de carregamento | 3,330 s | 0,001 s |
| Tempo de avaliação do prompt | 0,603 s | 0,087 s |
| Tokens gerados | 50 | 50 |
| Velocidade de geração | 14,74 tokens/s | 14,73 tokens/s |

#### Análise

Nos testes realizados com o modelo já carregado na memória, o tempo médio de resposta foi de aproximadamente 3,52 segundos. A velocidade de geração permaneceu praticamente constante, em torno de 14,73 tokens por segundo.

A primeira execução levou mais tempo devido ao carregamento do modelo. Os resultados demonstram a importância de diferenciar o tempo de inicialização do tempo necessário para processar uma solicitação.

**Limitações:** os resultados são preliminares e representam apenas um prompt específico, com uma resposta de 50 tokens. Mais testes são necessários para avaliar diferentes tamanhos de entrada e saída e obter uma estimativa mais robusta do desempenho.

**Arquivo do benchmark:** `benchmarks/benchmark.py`.

Os resultados individuais são armazenados localmente em `benchmarks/results.jsonl`, que está excluído do Git por meio do `.gitignore`.
