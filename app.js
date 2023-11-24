const express = require("express");
const app = express();
const cors = require("cors");

const port = 5000;
const Product = require("./models/product");
const Branch = require("./models/branch");
const Customer = require("./models/customer");
const Order = require("./models/order");

app.use(express.json());
app.use(cors());
app.get("/api/products", async (req, res) => {
  try {
    let query = {};

    // Check if a category is provided in the query parameters
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Check if a search term is provided in the query parameters
    if (req.query.search) {
      // Add a case-insensitive search condition for the name field
      query.name = { $regex: new RegExp(req.query.search, "i") };
    }

    const products = await Product.find(query);
    res.json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Fetch an individual product by ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/branches", async (req, res) => {
  try {
    const branches = await Branch.find();
    res.json({ branches });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/customers", async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json({ customers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/customers/:userName", async (req, res) => {
  try {
    const { userName } = req.params;
    const customer = await Customer.findOne({ userName });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await Customer.findOne({ userName: username });
    console.log(user["password"], password);

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Compare the provided password with the stored password
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.json({ message: "Login successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { username, branchId, order_type, product, total_amount } = req.body;

    // Check if the customer exists (assuming you have a Customer model)
    const customerExists = await Customer.exists({ userName: username });
    if (!customerExists) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Check if the branch exists (assuming you have a Branch model)
    const branchExists = await Branch.exists({ branchId: branchId });
    if (!branchExists) {
      return res.status(404).json({ message: "Branch not found" });
    }

    // Check if the product exists (assuming you have a Product model)
    const productExists = await Product.exists({ _id: product.product_id });
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Create the order
    const order = new Order({
      username,
      branchId,
      order_type,
      product,
      total_amount,
      last_updated_time: Date.now(),
    });
    await order.save();
    // Update the branch's noOfOrders
    await Branch.updateOne({ branchId: branchId }, { $inc: { noOfOrders: 1 } });

    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find();

    res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/ordersByCount-ts", async (req, res) => {
  try {
    const dateWiseOrders = await Order.aggregate([
      {
        $group: {
          _id: {
            order_type: "$order_type",
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$created_time" },
            },
          },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // Restructure the response for each order type
    const response = {
      cake: getDateWiseOrdersByType(dateWiseOrders, "cake"),
      cookie: getDateWiseOrdersByType(dateWiseOrders, "cookie"),
      muffin: getDateWiseOrdersByType(dateWiseOrders, "muffin"),
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Helper function to filter and map date-wise orders by order type
function getDateWiseOrdersByType(dateWiseOrders, orderType) {
  return dateWiseOrders
    .filter((item) => item._id.order_type === orderType)
    .map((item) => ({
      date: item._id.date,
      totalOrders: item.totalOrders,
    }));
}

app.get("/api/ordersByValue-ts", async (req, res) => {
  try {
    const dateWiseTotalAmountByType = await Order.aggregate([
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$created_time" },
            },
            order_type: "$order_type",
          },
          totalAmount: { $sum: "$total_amount" },
        },
      },
      {
        $sort: { "_id.date": 1, "_id.order_type": 1 },
      },
    ]);

    const result = {
      cake: dateWiseTotalAmountByType
        .filter((item) => item._id.order_type === "cake")
        .map((item) => ({ date: item._id.date, totalValue: item.totalAmount })),
      cookie: dateWiseTotalAmountByType
        .filter((item) => item._id.order_type === "cookie")
        .map((item) => ({ date: item._id.date, totalValue: item.totalAmount })),
      muffin: dateWiseTotalAmountByType
        .filter((item) => item._id.order_type === "totalValue")
        .map((item) => ({
          date: item._id.date,
          totalOrders: item.totalAmount,
        })),
    };

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/orderState", async (req, res) => {
  try {
    const totalOrdersByState = await Order.aggregate([
      {
        $group: {
          _id: "$order_state",
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const result = { Pending: 0, Processing: 0, Shipped: 0, Delivered: 0 };

    // Populate the result object with total number of orders for each order state
    totalOrdersByState.forEach((item) => {
      const { _id, totalOrders } = item;
      result[_id] = totalOrders;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/orderCategory", async (req, res) => {
  try {
    const totalOrdersByType = await Order.aggregate([
      {
        $group: {
          _id: "$order_type",
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // Create an object with all order types initialized to 0
    const result = {
      cake: 0,
      cookie: 0,
      muffin: 0,
    };

    // Populate the result object with actual counts
    totalOrdersByType.forEach((item) => {
      const { _id, totalOrders } = item;
      result[_id] = totalOrders;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/top-branches", async (req, res) => {
  try {
    const topBranches = await Branch.find({}).sort({ noOfOrders: -1 }).limit(5);

    res.json(topBranches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
