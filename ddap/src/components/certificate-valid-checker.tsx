"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { blockchainService, Certificate } from "@/lib/blockchain";

export default function CertificateValidChecker() {
  const [nationalId, setNationalId] = useState("");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const searchCertificates = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setCertificates([]);
    setCheckedAt(null);
    setIsLoading(true);

    try {
      const result = await blockchainService.getCertificatesByNationalId(
        nationalId
      );
      setCertificates(result);
      setCheckedAt(new Date().toISOString());
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError("Failed to search certificates: " + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Certificate Search</h1>
      </div>

      <form onSubmit={searchCertificates} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            National ID
          </label>
          <input
            type="text"
            placeholder="Enter National ID"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? "Searching..." : "Search Certificates"}
        </button>
      </form>

      {certificates.length > 0 && (
        <div className="mt-4 space-y-4">
          <div className="p-4 border rounded bg-white shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Search Results</h3>
            <p className="text-sm text-gray-600 mb-4">
              Found {certificates.length} certificate(s) for National ID:{" "}
              {nationalId}
            </p>
            <div className="space-y-6">
              {certificates.map((certificate) => (
                <div
                  key={certificate.tokenId}
                  className="border-t pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>Name:</strong> {certificate.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Reading Score:</strong> {certificate.readingScore}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Listening Score:</strong>{" "}
                      {certificate.listeningScore}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Issue Date:</strong>{" "}
                      {new Date(certificate.issueDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Expiration Date:</strong>{" "}
                      {new Date(
                        certificate.expirationDate
                      ).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Certificate Image:</strong>{" "}
                      <a
                        href={`https://${certificate.cidCertificate}.ipfs.w3s.link/image.png`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        View Certificate
                      </a>
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {checkedAt && (
              <p className="text-sm text-gray-500 mt-4">
                Last checked: {new Date(checkedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
