# Detecção Inteligente de Pessoas com YOLOv8 e Angular para Monitoramento em Tempo Real

## Descrição do Projeto

Este projeto visa o desenvolvimento de um sistema inteligente para a detecção e monitoramento de pessoas em Regiões de Interesse (ROIs) utilizando o algoritmo YOLOv8m. A solução integra um backend em Python, responsável pelo processamento das imagens e detecção, e um frontend desenvolvido com Angular para exibição e interação em tempo real. O sistema conta com comunicação via APIs RESTful, uso de câmeras IP para captura de vídeo, análise da infraestrutura de redes para transmissão eficiente, e otimização da posição das câmeras com regressão linear para maximizar a cobertura.

Todos os serviços do sistema são containerizados utilizando Docker, garantindo portabilidade, escalabilidade e facilidade de implantação em diferentes ambientes.

---

## Funcionalidades

- Detecção em tempo real de pessoas em áreas específicas utilizando YOLOv8m.
- Interface amigável para visualização dos dados e interações via Angular.
- Comunicação eficiente entre backend e frontend por APIs RESTful.
- Streaming de vídeo a partir de câmeras IP.
- Simulação e otimização da posição das câmeras utilizando regressão linear.
- Containerização dos serviços com Docker para fácil implantação.

---

## Tecnologias Utilizadas

- **YOLOv8m**: Algoritmo de detecção de objetos em tempo real.
- **Python**: Backend para processamento e integração.
- **Angular**: Framework front-end para a interface do usuário.
- **Docker**: Containerização dos serviços.
- **APIs RESTful**: Comunicação entre front-end e back-end.
- **Redes de Computadores**: Protocolos HTTP e RTSP para transmissão de dados.

---

## Estrutura do Repositório

 ```
 ├── GYM Back_end/ # Código do backend em Python
 ├── GYM front/ # Código do frontend em Angular
 ├── GYM mobile/ # Código do serviço Mobile em Flutter
 ├── GYM modelo/ # Serviço de requisição para as camerâs e aplicação do modelo
 ├── docker/ # Arquivos Docker para containerização
 ├── README.md # Este arquivo └── LICENSE # Licença do projeto
 ``` 


---

## Como Executar o Projeto

### Pré-requisitos

- Docker instalado na sua máquina
- Node.js (para executar o frontend localmente, opcional)
- Python 3.8+ (para executar o backend localmente, opcional)



   
