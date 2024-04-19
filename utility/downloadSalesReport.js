const PDFDocument = require("pdfkit");
const moment = require("moment");

// Function to generate sales report PDF
const generateSalesPDF = async (order, startDate, endDate) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      // Header content
      doc.fillColor("#444444")
         .fontSize(10)
         .text(`Period: ${startDate.toLocaleString()} to ${endDate.toLocaleString()}`, { align: "right" })
         .moveDown()
         .text("Al-athiqa", { align: "right" })
         .fontSize(10)
         .text("Antique collections", { align: "right" })
         .text("Calicut, Kerala", { align: "right" });

      // Sales report header at the top
      doc.fontSize(15)
         .text("Sales Report", {
           align: "center",
           width: 500,
           color: "white",
           backgroundColor: "gray",
         });

      // Table Header
      doc.fontSize(7)
         .text("Sl No", 40, 100)
         .text("Custom Order ID", 70, 100)
         .text("Username", 180, 100)
         .text("Order Date", 300, 100)
         .text("Payment Method", 400, 100)
         .text("Quantity", 470, 100)
         .text("Amount", 540, 100);

      // Generate rows for each order
      let y = 130;
      let sum = 0;
      order.forEach((x, i) => {
        const position = y + i * 30;
        sum += x.totalAmount;

        // Table row
        doc.fontSize(7)
           .text(i + 1, 40, position)
           .text(x.customOrderId, 70, position)
           .text(x.userId.name, 180, position)
           .text(moment(x.orderDate).format("DD/MM/YYYY HH:mm"), 300, position)
           .text(x.paymentMethod, 400, position)
           .text(x.totalQuantity, 470, position)
           .text(x.discountAmount || x.totalAmount, 540, position);

        // Draw line
        doc.moveTo(50, position + 15)
           .lineTo(560, position + 15)
           .lineWidth(0.5)
           .strokeColor("#ccc")
           .stroke();
      });

      // Summary
      doc.fontSize(7)
         .text("Total", 300, y + order.length * 30 + 20)
         .text(sum, 540, y + order.length * 30 + 20);

      // End the document
      doc.on("data", (buffer) => buffers.push(buffer));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (error) => reject(error));
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateSalesPDF,
};
