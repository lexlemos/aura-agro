import { create } from "zustand"

export interface LegalSource {
  type: string
  text: string
  link: string
}

export interface DecisionNode {
  id: string
  type: "decision" | "result"
  title: string
  description: string
  source: LegalSource
}

export interface Relationship {
  id: string
  source: string
  target: string
  label: "SIM" | "NÃO"
}

export interface CaseItem {
  id: string
  title: string
  nodes: DecisionNode[]
  edges: Relationship[]
}

interface GraphState {
  cases: CaseItem[]
  activeCaseId: string
  focusedNodeId: string | null
  readingNodeData: DecisionNode | null
  setActiveCaseId: (id: string) => void
  setFocusedNodeId: (id: string | null) => void
  setReadingNodeData: (data: DecisionNode | null) => void
  addNewCase: (title: string) => void
  deleteCase: (id: string) => void
  addCustomNode: (caseId: string, node: DecisionNode, edge: Relationship) => void
}

const defaultCases: CaseItem[] = [
  {
    id: "case-1",
    title: "Recurso Ordinário Trabalhista",
    nodes: [
      {
        id: "node-root",
        type: "decision",
        title: "Admissibilidade Recursal",
        description: "O recurso ordinário foi protocolado dentro do prazo de 8 dias úteis?",
        source: {
          type: "Artigo CLT",
          text: "Art. 895 da CLT - Cabe recurso ordinário para a instância superior no prazo de 8 dias.",
          link: "https://www.jusbrasil.com.br/topicos/10714774/artigo-895-da-consolidacao-das-leis-do-trabalho-decreto-lei-n-5452-de-01-de-maio-de-1943",
        },
      },
      {
        id: "node-preparo",
        type: "decision",
        title: "Preparo Efetuado",
        description: "As custas processuais e o depósito recursal foram devidamente pagos e comprovados?",
        source: {
          type: "Súmula TST",
          text: "Súmula nº 245 do TST - O preparo recursal deve ser comprovado no prazo recursal.",
          link: "https://www.jusbrasil.com.br/jurisprudencia/sumulas/tst/sumula-245",
        },
      },
      {
        id: "node-intempestivo",
        type: "result",
        title: "Recurso Intempestivo",
        description: "Extinção do processo sem resolução do mérito por intempestividade.",
        source: {
          type: "Artigo CPC",
          text: "Art. 932, III do CPC - Cabe ao relator não conhecer de recurso inadmissível.",
          link: "https://www.jusbrasil.com.br/topicos/28892497/artigo-932-da-lei-n-13105-de-16-de-marco-de-2015",
        },
      },
      {
        id: "node-vinculo",
        type: "decision",
        title: "Vínculo Empregatício",
        description: "Ficou caracterizada a subordinação, habitualidade, onerosidade e pessoalidade?",
        source: {
          type: "Artigo CLT",
          text: "Art. 3º da CLT - Considera-se empregado toda pessoa física que prestar serviços de natureza não eventual a empregador, sob a dependência deste e mediante salário.",
          link: "https://www.jusbrasil.com.br/topicos/10729780/artigo-3-da-consolidacao-das-leis-do-trabalho-decreto-lei-n-5452-de-01-de-maio-de-1943",
        },
      },
      {
        id: "node-deserto",
        type: "result",
        title: "Recurso Deserto",
        description: "Não conhecimento do recurso ordinário por deserção do preparo.",
        source: {
          type: "Súmula TST",
          text: "Súmula nº 128 do TST - Exige-se o depósito recursal para garantia do juízo.",
          link: "https://www.jusbrasil.com.br/jurisprudencia/sumulas/tst/sumula-128",
        },
      },
      {
        id: "node-procedente",
        type: "result",
        title: "Sentença Mantida",
        description: "Manutenção do reconhecimento do vínculo empregatício em segunda instância.",
        source: {
          type: "Jurisprudência",
          text: "Acórdão Regional TRT - Presença dos requisitos da relação de emprego comprovada por depoimento testemunhal.",
          link: "#",
        },
      },
      {
        id: "node-improcedente",
        type: "result",
        title: "Sentença Reformada",
        description: "Afastamento do vínculo por ausência de prova de subordinação.",
        source: {
          type: "Jurisprudência",
          text: "Acórdão Regional TRT - Ônus da prova do autor não satisfeito quanto ao requisito da subordinação jurídica.",
          link: "#",
        },
      },
    ],
    edges: [
      { id: "e1", source: "node-root", target: "node-preparo", label: "SIM" },
      { id: "e2", source: "node-root", target: "node-intempestivo", label: "NÃO" },
      { id: "e3", source: "node-preparo", target: "node-vinculo", label: "SIM" },
      { id: "e4", source: "node-preparo", target: "node-deserto", label: "NÃO" },
      { id: "e5", source: "node-vinculo", target: "node-procedente", label: "SIM" },
      { id: "e6", source: "node-vinculo", target: "node-improcedente", label: "NÃO" },
    ],
  },
  {
    id: "case-2",
    title: "Indenização por Danos Morais",
    nodes: [
      {
        id: "node-root-2",
        type: "decision",
        title: "Ato Ilícito",
        description: "Houve conduta ilícita, culposa ou dolosa do réu?",
        source: {
          type: "Artigo Código Civil",
          text: "Art. 186 do Código Civil - Aquele que, por ação ou omissão voluntária, negligência ou imprudência, violar direito e causar dano a outrem, comete ato ilícito.",
          link: "https://www.jusbrasil.com.br/topicos/10718503/artigo-186-da-lei-n-10406-de-10-de-janeiro-de-2002",
        },
      },
      {
        id: "node-dano-2",
        type: "decision",
        title: "Dano Comprovado",
        description: "A vítima sofreu efetivo abalo psicológico ou ofensa aos direitos de personalidade?",
        source: {
          type: "Artigo CF/88",
          text: "Art. 5º, V da CF - É assegurado o direito de resposta, proporcional ao agravo, além da indenização por dano material, moral ou à imagem.",
          link: "https://www.jusbrasil.com.br/topicos/10647895/artigo-5-da-constituicao-federal-de-1988",
        },
      },
      {
        id: "node-sem-ato-2",
        type: "result",
        title: "Ausência de Conduta",
        description: "Improcedência. A conduta do réu estava no exercício regular de um direito.",
        source: {
          type: "Artigo Código Civil",
          text: "Art. 188, I do Código Civil - Não constituem atos ilícitos os praticados em legítima defesa ou no exercício regular de um direito.",
          link: "https://www.jusbrasil.com.br/topicos/10718302/artigo-188-da-lei-n-10406-de-10-de-janeiro-de-2002",
        },
      },
      {
        id: "node-nexo-2",
        type: "decision",
        title: "Nexo Causal",
        description: "Existe relação direta de causa e efeito entre o ato ilícito e o dano?",
        source: {
          type: "Artigo Código Civil",
          text: "Art. 403 do Código Civil - As perdas e danos só incluem os prejuízos efetivos e lucros cessantes por efeito direto e imediato da inexecução.",
          link: "https://www.jusbrasil.com.br/topicos/10708682/artigo-403-da-lei-n-10406-de-10-de-janeiro-de-2002",
        },
      },
      {
        id: "node-sem-dano-2",
        type: "result",
        title: "Ausência de Dano",
        description: "Improcedência. Mero dissabor cotidiano não gera direito a indenização moral.",
        source: {
          type: "Jurisprudência",
          text: "Mero descumprimento contratual, em regra, não gera dano moral in re ipsa.",
          link: "#",
        },
      },
      {
        id: "node-indenizar-2",
        type: "result",
        title: "Dever de Indenizar",
        description: "Procedência da ação com arbitramento do quantum indenizatório.",
        source: {
          type: "Artigo Código Civil",
          text: "Art. 927 do Código Civil - Aquele que, por ato ilícito, causar dano a outrem, fica obrigado a repará-lo.",
          link: "https://www.jusbrasil.com.br/topicos/10675662/artigo-927-da-lei-n-10406-de-10-de-janeiro-de-2002",
        },
      },
      {
        id: "node-sem-nexo-2",
        type: "result",
        title: "Ausência de Responsabilidade",
        description: "Improcedência. Ocorrência de culpa exclusiva da vítima ou de força maior.",
        source: {
          type: "Doutrina",
          text: "Excludentes de nexo causal rompem o dever de indenizar do agente.",
          link: "#",
        },
      },
    ],
    edges: [
      { id: "e2-1", source: "node-root-2", target: "node-dano-2", label: "SIM" },
      { id: "e2-2", source: "node-root-2", target: "node-sem-ato-2", label: "NÃO" },
      { id: "e2-3", source: "node-dano-2", target: "node-nexo-2", label: "SIM" },
      { id: "e2-4", source: "node-dano-2", target: "node-sem-dano-2", label: "NÃO" },
      { id: "e2-5", source: "node-nexo-2", target: "node-indenizar-2", label: "SIM" },
      { id: "e2-6", source: "node-nexo-2", target: "node-sem-nexo-2", label: "NÃO" },
    ],
  },
]

export const useGraphStore = create<GraphState>((set) => ({
  cases: defaultCases,
  activeCaseId: "case-1",
  focusedNodeId: null,
  readingNodeData: null,

  setActiveCaseId: (id) => set({ activeCaseId: id, focusedNodeId: null, readingNodeData: null }),
  setFocusedNodeId: (id) => set({ focusedNodeId: id }),
  setReadingNodeData: (data) => set({ readingNodeData: data }),

  addNewCase: (title) =>
    set((state) => {
      const newId = `case-${Date.now()}`
      const newCase: CaseItem = {
        id: newId,
        title,
        nodes: [
          {
            id: `node-root-${Date.now()}`,
            type: "decision",
            title: "Nó Inicial",
            description: "Escreva no chat para criar novas hipóteses de decisão.",
            source: {
              type: "Legislação Geral",
              text: "Art. 1º - Defina a premissa fundamental deste caso jurídico.",
              link: "#",
            },
          },
        ],
        edges: [],
      }
      return {
        cases: [newCase, ...state.cases],
        activeCaseId: newId,
        focusedNodeId: null,
        readingNodeData: null,
      }
    }),

  deleteCase: (id) =>
    set((state) => {
      const updatedCases = state.cases.filter((c) => c.id !== id)
      let nextActiveId = state.activeCaseId

      if (state.activeCaseId === id) {
        nextActiveId = updatedCases.length > 0 ? updatedCases[0].id : ""
      }

      // If no cases left, create a default one
      if (updatedCases.length === 0) {
        const defaultId = "case-default"
        const defaultCase: CaseItem = {
          id: defaultId,
          title: "Novo Caso Padrão",
          nodes: [
            {
              id: "node-default-root",
              type: "decision",
              title: "Nó Inicial",
              description: "Digite uma mensagem no chat para começar.",
              source: {
                type: "Legislação Geral",
                text: "Fundamentação inicial.",
                link: "#",
              },
            },
          ],
          edges: [],
        }
        return {
          cases: [defaultCase],
          activeCaseId: defaultId,
          focusedNodeId: null,
          readingNodeData: null,
        }
      }

      return {
        cases: updatedCases,
        activeCaseId: nextActiveId,
        focusedNodeId: null,
        readingNodeData: null,
      }
    }),

  addCustomNode: (caseId, node, edge) =>
    set((state) => ({
      cases: state.cases.map((c) => {
        if (c.id === caseId) {
          return {
            ...c,
            nodes: [...c.nodes, node],
            edges: [...c.edges, edge],
          }
        }
        return c
      }),
    })),
}))
