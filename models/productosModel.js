const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'sql3.freesqldatabase.com',
    user: 'sql3795134',
    password: 'sSbGWvCdju',
    database: 'sql3795134',
    port: 3306
});

module.exports = {
    fetchProduct: (callback) => {
        pool.query('SELECT * FROM productos', (err, results) => {
            if (err) {
                console.error('Error al obtener los productos:', err);
                callback(null);
            } else {
                callback(results);
            }
        });
    },
    fetchCarrito: (userId, callback) => {
        const query = userId === '0'
            ? `SELECT carrito.idcarrito,
                      productos.idproductos,
                      usuarios.idusuarios,
                      usuarios.nombre,
                      productos.nombre as 'producto',
                      productos.precio,
                      productos.imagen,
                      carrito.cantidad
               FROM productos, carrito, usuarios
               WHERE carrito.idproductos = productos.idproductos 
                 AND carrito.idusuarios = usuarios.idusuarios`
            : `SELECT carrito.idcarrito,
                      productos.idproductos,
                      usuarios.idusuarios,
                      usuarios.nombre,
                      productos.nombre as 'producto',
                      productos.precio,
                      productos.imagen,
                      carrito.cantidad
               FROM productos, carrito, usuarios
               WHERE carrito.idproductos = productos.idproductos 
                 AND carrito.idusuarios = usuarios.idusuarios
                 AND usuarios.idusuarios = ?`;

        const params = userId === '0' ? [] : [userId];

        pool.query(query, params, (err, results) => {
            if (err) {
                console.error('Error al obtener el carrito:', err);
                callback(null);
            } else {
                callback(results);
            }
        });
    },
    fetchProductOne: (object, callback) => {
        pool.query('SELECT * FROM productos WHERE idproductos = ?', [object.idproductos], (err, results) => {
            if (err) {
                console.error('Error al obtener el producto:', err);
                callback(null);
            } else {
                callback(results.length > 0 ? results[0] : null); // Return the product or null if not found
            }
        });
    },
    insertProduct: async (object, callback) => {
        pool.query('INSERT INTO productos SET ?', object, (err, result) => {
            if (err) {
                console.error('Error al insertar el productos:', err);
                callback(null, err);
                return;
            }

            pool.query('SELECT * FROM productos WHERE idproductos = ?', [result.insertId], (err, product) => {
                if (err) {
                    console.error('Error al obtener el producto insertado:', err);
                    callback(null, err);
                    return;
                }
                callback(product[0], null);
            });
        });
    },
    insertProductCarrito: (object, callback) => {
        // Check if the product already exists in the cart for the user
        const checkQuery = `SELECT * FROM carrito WHERE idproductos = ? AND idusuarios = ?`;
        pool.query(checkQuery, [object.idproductos, object.idusuarios], (err, results) => {
            if (err) {
                console.error('Error al verificar el producto en el carrito:', err);
                callback(null);
                return;
            }

            if (results.length > 0) {
                // If the product exists, increment the cantidad
                const updateQuery = `UPDATE carrito SET cantidad = cantidad + ? WHERE idproductos = ? AND idusuarios = ?`;
                pool.query(updateQuery, [object.cantidad || 1, object.idproductos, object.idusuarios], (err, result) => {
                    if (err) {
                        console.error('Error al actualizar la cantidad del producto en el carrito:', err);
                        callback(null);
                        return;
                    }
                    callback(result);
                });
            } else {
                // If the product does not exist, insert it into the cart with cantidad = 1 by default
                const newObject = { ...object, cantidad: object.cantidad || 1 };
                pool.query('INSERT INTO carrito SET ?', newObject, (err, result) => {
                    if (err) {
                        console.error('Error al insertar en el carrito:', err);
                        callback(null);
                        return;
                    }
                    callback(result);
                });
            }
        });
    },
    updateProduct: (object, callback) => {
        pool.query('UPDATE productos SET ? WHERE idproductos=?', [object, object.idproductos], (err, result) => {
            if (err) throw err;

            if (result.affectedRows === 0) {
                return callback(null); 
            }

            pool.query('SELECT * FROM productos WHERE idproductos = ?', [object.idproductos], (err, updatedProduct) => {
                if (err) throw err;
                callback(updatedProduct[0]); 
            });
        });
    },
    deleteProduct: (object, callback) => {
        // First, delete associated rows in the carrito table
        pool.query('DELETE FROM carrito WHERE idproductos = ?', [object.idproductos], (err) => {
            if (err) {
                console.error('Error al eliminar los productos del carrito:', err);
                callback(null);
                return;
            }

            // Then, delete the product from the productos table
            pool.query('DELETE FROM productos WHERE idproductos = ?', [object.idproductos], (err, result) => {
                if (err) {
                    console.error('Error al eliminar el producto:', err);
                    callback(null);
                } else {
                    callback(result);
                }
            });
        });
    },
    deleteCarritos: (object, callback) => {
        pool.query('DELETE FROM carrito WHERE idcarrito= ?', [object.idcarrito], (err, result) => {
            if (err) {
                console.error('Error al eliminar el carrito:', err);
                callback(null);
            } else {
                callback(result);
            }
        });
    },
    insertInvoiceHeader: (object, callback) => {
        console.log('Inserting into cabecera_factura:', object); // Log the data being inserted
        pool.query('INSERT INTO cabecera_factura SET ?', object, (err, result) => {
            if (err) {
                console.error('Error al insertar la cabecera de la factura:', err.stack); // Log the error stack
                console.error('Query executed:', pool.format('INSERT INTO cabecera_factura SET ?', object)); // Log the query
                callback(null);
            } else {
                console.log('Cabecera de factura insertada:', result); // Log the result
                callback(result);
            }
        });
    },

    insertInvoiceDetails: (details, callback) => {
        const values = details.map((detail) => [
            detail.idfactura,
            detail.idproductos,
            detail.cantidad,
            detail.precio_unitario,
            detail.subtotal,
        ]);

        console.log('Inserting into detalle_factura:', values); // Log the data being inserted
        pool.query(
            'INSERT INTO detalle_factura (idfactura, idproductos, cantidad, precio_unitario, subtotal) VALUES ?',
            [values],
            (err, result) => {
                if (err) {
                    console.error('Error al insertar los detalles de la factura:', err.stack); // Log the error stack
                    callback(null);
                } else {
                    console.log('Detalles de factura insertados:', result); // Log the result
                    callback(result);
                }
            }
        );
    },
    fetchInvoiceData: (idfactura, callback) => {
        const queryCabecera = 'SELECT * FROM cabecera_factura WHERE idfactura = ?';
        const queryDetalles = `
            SELECT df.*, p.nombre 
            FROM detalle_factura df
            JOIN productos p ON df.idproductos = p.idproductos
            WHERE df.idfactura = ?`;

        pool.query(queryCabecera, [idfactura], (err, cabeceraResults) => {
            if (err || cabeceraResults.length === 0) {
                console.error('Error al obtener la cabecera de la factura:', err);
                callback(null);
                return;
            }

            const cabecera = cabeceraResults[0];

            pool.query(queryDetalles, [idfactura], (err, detallesResults) => {
                if (err) {
                    console.error('Error al obtener los detalles de la factura:', err);
                    callback(null);
                    return;
                }

                callback({ cabecera, detalles: detallesResults });
            });
        });
    },
    verifyProductIds: (productIds, callback) => {
        const query = 'SELECT idproductos FROM productos WHERE idproductos IN (?)';
        pool.query(query, [productIds], (err, results) => {
            if (err) {
                console.error('Error al verificar los idproductos:', err.stack);
                callback([]);
            } else {
                const validIds = results.map(row => row.idproductos);
                console.log('Valid idproductos:', validIds);
                callback(validIds);
            }
        });
    },
    updateCarritoCantidad: (idcarrito, cantidad, callback) => {
        const query = 'UPDATE carrito SET cantidad = ? WHERE idcarrito = ?';
        pool.query(query, [cantidad, idcarrito], (err, result) => {
            if (err) {
                console.error('Error al actualizar la cantidad del carrito:', err);
                callback(null);
            } else {
                callback(result);
            }
        });
    },
    clearCart: (idusuarios, callback) => {
        const query = 'DELETE FROM carrito WHERE idusuarios = ?';
        pool.query(query, [idusuarios], (err, result) => {
            if (err) {
                console.error('Error al limpiar el carrito:', err);
                callback(null);
            } else {
                callback(result);
            }
        });
    },
    fetchAllSales: (callback) => {
        const query = `
            SELECT cf.idfactura, cf.idusuarios, cf.fecha, cf.total,
                   df.idproductos, df.cantidad, df.precio_unitario, df.subtotal,
                   p.nombre AS producto, u.nombre AS usuario
            FROM cabecera_factura cf
            JOIN detalle_factura df ON cf.idfactura = df.idfactura
            JOIN productos p ON df.idproductos = p.idproductos
            JOIN usuarios u ON cf.idusuarios = u.idusuarios
            ORDER BY cf.fecha DESC;
        `;
        pool.query(query, (err, results) => {
            if (err) {
                console.error('Error al obtener las ventas:', err);
                callback(null);
            } else {
                callback(results);
            }
        });
    },
};