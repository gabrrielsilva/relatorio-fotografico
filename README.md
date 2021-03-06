# Relatório fotográfico

## Requisitos

- Node.js 16.14.2 LTS (https://nodejs.org/dist/v16.14.2/node-v16.14.2-x64.msi)

## Como usar

- Coloque um arquivo **kmz** na pasta **input** do diretório principal, este kmz deve ter uma pasta com todos os marcadores nomeados e de preferência as duas fotos do poste em cada marcador (se um poste não tiver uma ou as duas fotos, será usada uma foto padrão Infinitel). Aqui está um exemplo de arquivo kmz para testes: https://drive.google.com/file/d/1m0a7MGLIKi9Zny-R9bdTzhelhzNTwwT2/view?usp=sharing

- Abra um terminal, vá até o diretório principal:

```sh
cd caminho-do-diretorio/relatorio-fotografico
```

- Instale as dependências com:

```sh
npm install
```

- Altere as informações do projeto via linha de comando

- Altere as logos do cabeçalho trocando as imagens dos diretórios: **"src/static/images/left-logo"** e **"src/static/images/right-logo"** (a resolução deve ser de até 500x200px, estou deixando na pasta **"src/static/images/sample"** alguns exemplos que podem ser usados)

- Execute o script:

```sh
npm run create
```

- E... pronto! Seu relatório está dentro da pasta **output** 😉

Ele se parece com isso:

<p align="center">
  <img width="600" height="auto" src="https://github.com/gabrrielsilva/relatorio-fotografico/blob/main/example.png?raw=true">
</p>

## Por baixo dos panos

Através do arquivo kmz é extraído um arquivo kml e uma pasta, com todas as fotos dos postes que estão nos marcadores. Após a extração, o arquivo kml é convertido para geojson, uma notação onde estão todos os dados geográficos e a lista de marcadores, cada um com nome, coordenadas e o caminho para o diretório das fotos.
