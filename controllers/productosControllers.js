const productosModel = require("../models/productosModel");
const PDFDocument = require('pdfkit'); // Import PDFKit
const fs = require('fs'); // File system module

class productosController{
    constructor(){
        Object.preventExtensions(this);
    }

    getAll = async (req, res) => {
        productosModel.fetchProduct((result) => {
            if (!result) {
                return res.status(500).json({ message: "Error al obtener los productos" });
            }
            res.status(200).json(result);
        });
    }

    getAllCarrito = async (req, res) => {
        const userId = req.query.userId || '0'; // Default to '0' for all carts
        productosModel.fetchCarrito(userId, (result) => {
            if (!result) {
                return res.status(500).json({ message: "Error al mostrar el carrito" });
            }
            res.status(200).json(result);
        });
    }

    getOne = async (req, res) => {
        let object = { idproductos: req.params.id }; // Corrected key to match database column

        productosModel.fetchProductOne(object, (result) => {
            if (!result) {
                return res.status(404).json({ message: "Producto no encontrado" });
            }
            res.status(200).json(result);
        });
    }

    createProduct = async (req, res) => {
            let object = req.body;
            if (req.file) {
                object.imagen = req.file.filename; // Use the resized filename
            }
            productosModel.insertProduct(object, (product, error) => {
                if (error) {
                    return res.status(500).json({ message: "Error al insertar el producto", error });
                }
                res.status(201).json({
                    message: "Producto creado con éxito",
                    producto: product
                });
            });
        };

    carrito = async (req, res) => {
        const object = {
            idproductos: req.body.idproductos,
            idusuarios: req.body.idusuarios // Ensure this field is included
        };

        productosModel.insertProductCarrito(object, (product) => {
            if (!product) {
                return res.status(500).json({ message: "Error al agregar al carrito" });
            }
            res.status(201).json({ 
                message: "Producto agregado al carrito con éxito",
                producto: product
            });
        });
    };

    update = async (req, res) => {
        const object = { ...req.body, idproductos: req.params.id }; // Recibe los datos + ID
        if (req.file) {
            // Si se subió una nueva imagen, se actualiza la imagen
            object.imagen = req.file.filename;
        }
        productosModel.updateProduct(object, (updatedProduct) => {
            if (!updatedProduct) {
                return res.status(404).json({ message: "No se pudo actualizar el producto" });
            }

            res.status(200).json({ 
                message: "Producto actualizado correctamente",
                producto: updatedProduct
            });
        });
    }

    delete = async (req, res) => {
        let object = { idproductos: req.params.id };

        productosModel.deleteProduct(object, (result) => {
            if (!result || result.affectedRows === 0) {
                return res.status(404).json({ message: "No se pudo eliminar el producto" });
            }
            res.status(200).json({ message: "Producto eliminado correctamente" });
        });
    }
    deleteCar = async (req, res) => {
        let object = { idcarrito: req.params.id };

        productosModel.deleteCarritos(object, (result) => {
            if (!result || result.affectedRows === 0) {
                return res.status(404).json({ message: "No se pudo eliminar el producto del carrito" });
            }
            res.status(200).json({ message: "Producto eliminado del carrito correctamente" });
        });
    }

    generateInvoice = async (req, res) => {
        const { idusuarios, items } = req.body;
        console.log('Data received in generateInvoice:', { idusuarios, items }); // Log the data received

        if (!idusuarios || !items || items.length === 0) {
            console.error('Invalid data received:', { idusuarios, items });
            return res.status(400).json({ message: "Datos incompletos para generar la factura" });
        }

        const total = items.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0);
        console.log('Calculated total:', total); // Log the calculated total

        // Insert into cabecera_factura
        const invoiceHeader = { idusuarios, total };
        console.log('Invoice header to insert:', invoiceHeader); // Log the invoice header data

        productosModel.insertInvoiceHeader(invoiceHeader, (headerResult) => {
            if (!headerResult) {
                console.error('Error al insertar la cabecera de la factura');
                return res.status(500).json({ message: "Error al generar la cabecera de la factura" });
            }

            const idfactura = headerResult.insertId;
            console.log('Cabecera de factura insertada con ID:', idfactura); // Log the inserted header ID

            // Verify that all idproductos exist in the productos table
            const productIds = items.map(item => item.idproductos);
            productosModel.verifyProductIds(productIds, (validIds) => {
                if (validIds.length !== productIds.length) {
                    console.error('Some idproductos do not exist in the productos table:', productIds);
                    return res.status(400).json({ message: "Algunos productos no existen en la base de datos" });
                }

                // Insert into detalle_factura
                const details = items.map((item) => ({
                    idfactura,
                    idproductos: item.idproductos,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    subtotal: item.cantidad * item.precio_unitario,
                }));

                console.log('Details to insert:', details); // Log the details to be inserted

                productosModel.insertInvoiceDetails(details, (detailResult) => {
                    if (!detailResult) {
                        console.error('Error al insertar los detalles de la factura');
                        return res.status(500).json({ message: "Error al generar los detalles de la factura" });
                    }

                    console.log('Detalles de factura insertados:', detailResult); // Log the inserted details

                    // Delete items from the cart for the user
                    productosModel.clearCart(idusuarios, (clearResult) => {
                        if (!clearResult) {
                            console.error('Error al limpiar el carrito');
                            return res.status(500).json({ message: "Error al limpiar el carrito después de generar la factura" });
                        }

                        console.log('Carrito limpiado para el usuario:', idusuarios);
                        res.status(201).json({ message: "Factura generada con éxito y carrito limpiado", idfactura });
                    });
                });
            });
        });
    };

    generateInvoicePDF = async (req, res) => {
        const { idfactura } = req.params;

        // Fetch invoice data from the database
        productosModel.fetchInvoiceData(idfactura, (invoiceData) => {
            if (!invoiceData) {
                return res.status(404).json({ message: "Factura no encontrada" });
            }

            const { cabecera, detalles } = invoiceData;

            // Create a new PDF document
            const doc = new PDFDocument({ margin: 40 });

            // Set the response headers for PDF download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=factura_${idfactura}.pdf`);

            // Pipe the PDF document to the response
            doc.pipe(res);

            // Add Invoice Header
            doc.fontSize(20).text('Factura', { align: 'center', underline: true });
            doc.moveDown();

            doc.fontSize(12).text(`Factura ID: ${cabecera.idfactura}`, { align: 'left' });
            doc.text(`Usuario ID: ${cabecera.idusuarios}`, { align: 'left' });
            doc.text(`Fecha: ${cabecera.fecha}`, { align: 'left' });
            doc.text(`Total: ${Number(cabecera.total).toFixed(2)} MXN`, { align: 'left' });
            doc.moveDown();

            // Add a line separator
            doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();

            // Add Table Header for Details
            doc.fontSize(14).text('Detalles de la Factura:', { align: 'left', underline: true });
            doc.moveDown();

            doc.fontSize(12);
            const tableTop = doc.y;
            const columnWidths = [40, 200, 80, 80, 80];

            // Draw Table Header
            doc.text('No.', 40, tableTop, { width: columnWidths[0], align: 'center' });
            doc.text('Producto', 80, tableTop, { width: columnWidths[1], align: 'left' });
            doc.text('Cantidad', 280, tableTop, { width: columnWidths[2], align: 'center' });
            doc.text('Precio Unitario', 360, tableTop, { width: columnWidths[3], align: 'center' });
            doc.text('Subtotal', 440, tableTop, { width: columnWidths[4], align: 'center' });

            // Add a line separator
            doc.moveTo(40, tableTop + 15).lineTo(550, tableTop + 15).stroke();
            doc.moveDown();

            // Add Table Rows
            let rowTop = tableTop + 20;
            detalles.forEach((detalle, index) => {
                doc.text(index + 1, 40, rowTop, { width: columnWidths[0], align: 'center' });
                doc.text(detalle.nombre, 80, rowTop, { width: columnWidths[1], align: 'left' });
                doc.text(detalle.cantidad, 280, rowTop, { width: columnWidths[2], align: 'center' });
                doc.text(`${Number(detalle.precio_unitario).toFixed(2)} MXN`, 360, rowTop, { width: columnWidths[3], align: 'center' });
                doc.text(`${Number(detalle.subtotal).toFixed(2)} MXN`, 440, rowTop, { width: columnWidths[4], align: 'center' });
                rowTop += 20;
            });

            // Add Footer
            doc.moveDown(2);
            doc.fontSize(10).text('Gracias por su compra.', { align: 'center' });
            doc.text('Marketplace - Tu destino en línea para productos únicos.', { align: 'center' });

            // Finalize the PDF and end the stream
            doc.end();
        });
    };

    updateCarritoCantidad = async (req, res) => {
        const { idcarrito } = req.params;
        const { cantidad } = req.body;

        if (!idcarrito || !cantidad) {
            return res.status(400).json({ message: "Datos incompletos para actualizar la cantidad" });
        }

        productosModel.updateCarritoCantidad(idcarrito, cantidad, (result) => {
            if (!result || result.affectedRows === 0) {
                return res.status(404).json({ message: "Carrito no encontrado o no se pudo actualizar" });
            }
            res.status(200).json({ message: "Cantidad actualizada correctamente" });
        });
    };

    getAllSales = async (req, res) => {
        productosModel.fetchAllSales((result) => {
            if (!result) {
                return res.status(500).json({ message: "Error al obtener las ventas" });
            }
            res.status(200).json(result);
        });
    };
}





module.exports=productosController;