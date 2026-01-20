import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12
  },
  title: {
    fontSize: 20,
    marginBottom: 20
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  }
});

export const OSPdf = ({ osData, itens, totais }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>FBMSTORE | ORÇAMENTO</Text>

      <Text>Cliente: {osData.cliente}</Text>
      <Text>Contato: {osData.contato}</Text>
      <Text>Endereço: {osData.endereco}</Text>

      <View style={{ marginTop: 20 }}>
        {itens.map((item: any, i: number) => (
          <View key={i} style={styles.row}>
            <Text>{item.qtd}x {item.produto}</Text>
            <Text>R$ {(item.qtd * item.preco).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <Text style={{ marginTop: 20 }}>
        TOTAL: R$ {totais.total.toFixed(2)}
      </Text>
    </Page>
  </Document>
);
