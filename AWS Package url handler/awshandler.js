module.exports.handler = async (event) => {
    const packageUrl = JSON.parse(event.body).url;
  
    // Example processing logic for the package URL
    console.log("Received package URL:", packageUrl);
  
    // Return a response
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Package ingestion request received successfully", packageUrl }),
    };
  };