import os

import pandas as pd

from sqlalchemy import create_engine

from git import Repo



# --- 1. Configurações Gerais ---



# Banco de Dados

server_name = 'srv-vibcor20'

database_name = 'PGO_STG'

engine_str = f"mssql+pyodbc://{server_name}/{database_name}?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes"



# Git / Arquivo

PATH_REPOSITORIO = r"C:\Users\kaiorodrigues.000\Desktop\Teste-html"

NOME_ARQUIVO = "consolidado_monitoramento.csv"

CAMINHO_COMPLETO_CSV = os.path.join(PATH_REPOSITORIO, NOME_ARQUIVO)

MENSAGEM_COMMIT = "Atualização diária de dados"



# Inicializa a conexão com o banco

engine = create_engine(engine_str)



# --- 2. Funções de Transformação e Extração ---



def extrair_info_pressao(tag):

    try:

        partes = str(tag).split('.')

        if len(partes) >= 7:

            codigo = f"VRP.{partes[1]}.{partes[6]}"

            carac = 'Pressão Montante' if partes[4] == '001' else 'Pressão Jusante' if partes[4] == '002' else 'Outro'

            return pd.Series([codigo, carac])

    except: pass

    return pd.Series(['', ''])



def transformar_tag_vazao(tag):

    try:

        partes = str(tag).split('.')

        if len(partes) >= 5:

            num_vazao = int(partes[4])

            codigo = f"VZ{num_vazao}.{partes[0]}.{partes[1]}.{partes[2]}"

            return pd.Series([codigo, 'Vazão'])

    except: pass

    return pd.Series([tag, 'Vazão'])



def buscar_e_processar(tabela, tipo_dado):

    print(f"Buscando dados de {tipo_dado} na tabela {tabela}...")

    query = f"SELECT * FROM {tabela} WHERE [TEMPO] >= DATEADD(day, -7, GETDATE()) ORDER BY [TEMPO] ASC"

   

    df = pd.read_sql(query, engine)

    if df.empty:

        return pd.DataFrame()



    df['TEMPO'] = pd.to_datetime(df['TEMPO'])

   

    # --- 1. REMOÇÃO DE OUTLIERS (Método IQR) ---

    # Descobre dinamicamente qual é a coluna com o valor numérico lido do sensor

    col_valor_orig = [c for c in df.columns if c not in ['TAG', 'TEMPO']][0]

   

    # Calcula os quartis e o IQR agrupando por TAG (cada equipamento tem seu próprio padrão normal)

    Q1 = df.groupby('TAG')[col_valor_orig].transform(lambda x: x.quantile(0.25))

    Q3 = df.groupby('TAG')[col_valor_orig].transform(lambda x: x.quantile(0.75))

    IQR = Q3 - Q1

   

    # Define os limites de corte (o multiplicador 1.5 é o padrão estatístico)

    limite_inferior = Q1 - 1.5 * IQR

    limite_superior = Q3 + 1.5 * IQR

   

    # Filtra o dataframe original mantendo apenas os valores normais

    df = df[(df[col_valor_orig] >= limite_inferior) & (df[col_valor_orig] <= limite_superior)]

    # -------------------------------------------



    # Prepara o index para o resample

    df.set_index('TEMPO', inplace=True)

   

    # --- 2. Resample horário usando apenas os dados limpos ---

    df_res = df.groupby('TAG').resample('h').mean(numeric_only=True).reset_index()

   

    # Aplicar lógicas específicas de regras de negócio

    if tipo_dado == 'Pressão':

        df_res[['Código Equipamento', 'Característica']] = df_res['TAG'].apply(extrair_info_pressao)

    else:

        df_res[['Código Equipamento', 'Característica']] = df_res['TAG'].apply(transformar_tag_vazao)

   

    # Identificar a coluna de valor no dataframe transformado e renomear

    col_valor = [c for c in df_res.columns if c not in ['TAG', 'TEMPO', 'Código Equipamento', 'Característica']][0]

    df_res = df_res.rename(columns={col_valor: 'Valor'})

   

    return df_res[['TAG', 'Código Equipamento', 'Característica', 'TEMPO', 'Valor']]



# --- 3. Função de Upload para o GitHub ---



def subir_para_github():

    print("\nIniciando verificação do Git...")

    try:

        repo = Repo(PATH_REPOSITORIO)

       

        # Garante que estamos na branch correta (opcional)

        # repo.git.checkout('main')



        # Verifica se o arquivo mudou ou é novo (untracked)

        if NOME_ARQUIVO in repo.untracked_files or repo.is_dirty(path=NOME_ARQUIVO):

            repo.index.add([NOME_ARQUIVO])

            repo.index.commit(MENSAGEM_COMMIT)

           

            origin = repo.remote(name='origin')

            origin.push()

            print(f"✅ Arquivo '{NOME_ARQUIVO}' commitado e enviado (push) com sucesso!")

        else:

            print("ℹ️ Nenhuma alteração detectada no arquivo CSV. Nada foi enviado.")



    except Exception as e:

        print(f"❌ Erro ao enviar para o GitHub: {e}")



# --- 4. Execução Principal ---



def main():

    try:

        # Processa Pressões

        df_pres = buscar_e_processar('monitoramentoPressoes', 'Pressão')

       

        # Processa Vazões

        df_vaz = buscar_e_processar('monitoramentoVazoes', 'Vazão')



        # Unificar os DataFrames

        df_final = pd.concat([df_pres, df_vaz], ignore_index=True)



        if df_final.empty:

            print("Nenhum dado encontrado nas tabelas. Execução encerrada.")

            return



        # Cria o diretório do repositório caso não exista (prevenção de erro)

        if not os.path.exists(PATH_REPOSITORIO):

            os.makedirs(PATH_REPOSITORIO)



        # Salvar em CSV (agora salvando direto na pasta do repositório Git)

        df_final.to_csv(

            CAMINHO_COMPLETO_CSV,

            index=False,

            sep=';',

            encoding='utf-8-sig',

            decimal=',',

            float_format='%.2f'
            

        )



        print(f"\nSucesso! Arquivo '{NOME_ARQUIVO}' gerado com {len(df_final)} linhas no repositório local.")



        # Realizar o push do arquivo recém-gerado

        subir_para_github()



    except Exception as e:

        print(f"❌ Erro geral no processamento: {e}")



if __name__ == "__main__":

    main()