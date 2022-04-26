# Relatório fotográfico

## Requisitos

- Node.js 16.14.2 LTS (https://nodejs.org/dist/v16.14.2/node-v16.14.2-x64.msi)

## Como usar

- Coloque um arquivo **kmz** na pasta **input** do diretório principal, este kmz deve ter uma pasta com todos os marcadores renomeados em ordem crescente (1, 2, 3...) e de preferência as duas fotos do poste em cada marcador (se um poste não tiver alguma ou as duas fotos, será usada uma foto padrão Infinitel).
- Abra um terminal, vá até o diretório principal:

```sh
cd caminho-do-diretorio/relatorio-fotografico
```

- Instale as dependências com:

```sh
npm install
```

- Altere as informações do projeto abrindo o arquivo **data.ts** que está dentro da pasta **src**, em um editor de texto (isso será alterado futuramente, onde as informações do projeto serão preenchidas através do terminal, uma Command-Line Interface)

- Execute o script:

```sh
npm run create
```

- E... pronto! Seu relatório está dentro da pasta **output** 😉

Ele se parece com isso:

![alt text](https://github.com/gabrrielsilva/relatorio-fotografico/blob/main/example.png?raw=true)
