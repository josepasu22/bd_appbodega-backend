import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class ArticuloDetalleScreen extends StatelessWidget {
  final Map articulo;

  const ArticuloDetalleScreen({super.key, required this.articulo});

  Future<void> actualizarPrecio(BuildContext context) async {
    final TextEditingController precioController =
        TextEditingController(text: articulo['precio'].toString());

    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text("Actualizar precio"),
        content: TextField(
          controller: precioController,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(labelText: "Nuevo precio"),
        ),
        actions: [
          TextButton(
            onPressed: () async {
              final response = await http.put(
                Uri.parse("http://192.168.1.120:3000/articulos/${articulo['id']}"),
                headers: {"Content-Type": "application/json"},
                body: jsonEncode({
                  "descripcion": articulo['descripcion'],
                  "cantidad": articulo['cantidad'],
                  "precio": double.parse(precioController.text),
                }),
              );
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(response.statusCode == 200
                    ? "Precio actualizado correctamente"
                    : "Error al actualizar precio")),
              );
            },
            child: Text("Guardar"),
          ),
        ],
      ),
    );
  }

  Future<void> actualizarStock(BuildContext context) async {
    final TextEditingController stockController =
        TextEditingController(text: articulo['cantidad'].toString());

    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text("Actualizar stock"),
        content: TextField(
          controller: stockController,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(labelText: "Nuevo stock"),
        ),
        actions: [
          TextButton(
            onPressed: () async {
              final response = await http.put(
                Uri.parse("http://192.168.1.120:3000/articulos/${articulo['id']}"),
                headers: {"Content-Type": "application/json"},
                body: jsonEncode({
                  "descripcion": articulo['descripcion'],
                  "cantidad": int.parse(stockController.text),
                  "precio": articulo['precio'],
                }),
              );
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(response.statusCode == 200
                    ? "Stock actualizado correctamente"
                    : "Error al actualizar stock")),
              );
            },
            child: Text("Guardar"),
          ),
        ],
      ),
    );
  }

Future<void> eliminarArticulo(BuildContext context) async {
  final response = await http.delete(
    Uri.parse("http://192.168.1.120:3000/articulos/${articulo['id']}"),
  );

  if (response.statusCode == 200) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Artículo eliminado correctamente")),
    );
    Navigator.pop(context, true); // <- devuelve true
  } else {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Error al eliminar artículo")),
    );
  }
}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Artículo: ${articulo['descripcion']}")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            ElevatedButton(
              onPressed: () => actualizarPrecio(context),
              child: Text("Actualizar precio"),
            ),
            ElevatedButton(
              onPressed: () => actualizarStock(context),
              child: Text("Actualizar stock"),
            ),
            ElevatedButton(
              onPressed: () => eliminarArticulo(context),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: Text("Eliminar artículo"),
            ),
          ],
        ),
      ),
    );
  }
}