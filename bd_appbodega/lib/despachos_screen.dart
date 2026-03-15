import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';

import 'nuevo_despacho_screen.dart';

class DespachosScreen extends StatefulWidget {
  const DespachosScreen({super.key});

  @override
  State<DespachosScreen> createState() => _DespachosScreenState();
}

class _DespachosScreenState extends State<DespachosScreen> {
  List<dynamic> despachos = [];

  @override
  void initState() {
    super.initState();
    cargarDespachos();
  }

  Future<void> cargarDespachos() async {
    final response =
        await http.get(Uri.parse("http://192.168.1.120:3000/despachos/detalle"));
    if (response.statusCode == 200) {
      setState(() {
        despachos = jsonDecode(response.body);
      });
    } else {
      debugPrint("Error al cargar despachos: ${response.statusCode}");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Historial de Despachos"),
        backgroundColor: Colors.indigo,
      ),
      body: RefreshIndicator(
        onRefresh: cargarDespachos,
        child: ListView.builder(
          itemCount: despachos.length,
          itemBuilder: (context, index) {
            final d = despachos[index];
            final fecha = DateFormat("dd/MM/yyyy").format(DateTime.parse(d['fecha']));
            return Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 4,
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: ListTile(
                leading: const Icon(Icons.local_shipping, color: Colors.indigo),
                title: Text(
                  "Despacho ${d['numeroDespacho']}",
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Fecha: $fecha"),
                    Text("Colaborador: ${d['colaborador']}"),
                    Text("Artículo: ${d['articulo']}"),
                    Text("Cantidad: ${d['cantidad']} - Total: Q${d['total']}"),
                  ],
                ),
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Colors.indigo,
        child: const Icon(Icons.add),
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const NuevoDespachoScreen(),
            ),
          ).then((_) => cargarDespachos());
        },
      ),
    );
  }
}