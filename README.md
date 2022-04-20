# Relatório fotográfico

## Requisitos

- Node.js 16.14.2 LTS (https://nodejs.org/dist/v16.14.2/node-v16.14.2-x64.msi)

## Como usar

- Crie uma pasta chamada **photos** no diretório principal
- Coloque na pasta as fotos renomeadas, seguindo o seguinte padrão: 01.1.png, 01.2.png, 02.1.png, 02.2.png...
- Abra um terminal, vá até o diretório principal:

```sh
cd caminho-do-diretorio/relatorio-fotografico
```

- Instale as dependências com:

```sh
npm install
```

- Altere as informações do projeto abrindo o arquivo **data.ts**, que está dentro da pasta **src**, em um editor de texto

- Execute o script:

```sh
npm run create
```

- E... pronto! Uma pasta chamada **export** foi gerada, seu relatório está dentro dela 😉

Ele se parece com isso:

![alt text](https://github.com/gabrrielsilva/relatorio-fotografico/blob/main/example.jpeg?raw=true)

## Observações

A parte de renomear as fotos é provisória, construí este projeto para resolver um problema pessoal no trabalho (fazer relatórios fotográficos enormes e repetitivos), ainda não encontramos um jeito de ordenar as fotos, devido as circunstâncias atuais, penso que isso pode ser resolvido acessando os metadados da foto na origem. Em breve atualizações...
