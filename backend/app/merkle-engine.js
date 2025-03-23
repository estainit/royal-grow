const keccak256 = require("keccak256"); // Assuming you're using keccak256 library

// Helper function to hash data with Keccak-256
function doKeccak256(data) {
  let hash = keccak256(data);
  hash = hash.toString("hex");
  hash = keccak256(hash);
  hash = hash.toString("hex");
  return hash.substring(0, 8); //shrtening for the sake of proof length
}

function generate_m(
  elms,
  input_type = "string",
  hash_algorithm = "keccak256",
  version = "0.0.0"
) {
  let proofs = {};

  let root = "";
  let levels = 0;
  let leaves = 0;
  if (elms.length == 0) {
    return {
      root,
      proofs,
      version,
      levels,
      leaves,
    };
  }

  if (elms.length == 1) {
    if (input_type == "hashed") {
      root = elms[0];
    } else {
      root = do_hash_a_node(elms[0], hash_algorithm);
    }
    return {
      root,
      proofs,
      version,
      levels: 1, //levels
      leaves: 1, // leaves
    };
  }

  // fitting leaves conut
  let inx = elms.length;
  console.log("elms.length in Merkle: ", elms.length);
  let needed_leaves = calcNeededLeaves(inx);
  console.log("needed_leaves ", needed_leaves);
  //let elms_ = elms;
  while (inx < needed_leaves) {
    let the_elm = "leave_" + (inx + 1);
    elms.push(the_elm);
    inx += 1;
  }
  console.log("elms.length after add needed: ", elms.length);

  let innerMerkleRes = inner_merkle(elms, input_type, hash_algorithm, "");
  root = innerMerkleRes.root;
  verifies = innerMerkleRes.verifies;
  leaves = innerMerkleRes.leaves;
  levels = innerMerkleRes.levels;

  let final_verifies = {};
  let keys = Object.keys(verifies);

  keys.sort(); // FIXME: the true order is reverse sort, also consider the version 0.1.0 in order to solve "fake right leave" problem
  for (const key of keys) {
    let a_proof = verifies[key];
    let the_key = key.substring(2);
    if (!final_verifies.hasOwnProperty(the_key)) {
      final_verifies[the_key] = a_proof;
    }
  }
  return {
    root,
    proofs: final_verifies,
    version,
    levels,
    leaves,
  };
}

function calcNeededLeaves(inx) {
  let needed_leaves = 1;
  if (1 <= inx && inx <= 2) {
    needed_leaves = 2;
  } else if (3 <= inx && inx <= 4) {
    needed_leaves = 4;
  } else if (5 <= inx && inx <= 8) {
    needed_leaves = 8;
  } else if (9 <= inx && inx <= 16) {
    needed_leaves = 16;
  } else if (17 <= inx && inx <= 32) {
    needed_leaves = 32;
  } else if (33 <= inx && inx <= 64) {
    needed_leaves = 64;
  } else if (65 <= inx && inx <= 128) {
    needed_leaves = 128;
  } else if (129 <= inx && inx <= 256) {
    needed_leaves = 256;
  } else if (257 <= inx && inx <= 512) {
    needed_leaves = 512;
  } else if (513 <= inx && inx <= 1024) {
    needed_leaves = 1024;
  } else if (1025 <= inx && inx <= 2048) {
    needed_leaves = 2048;
  } else if (2049 <= inx && inx <= 4096) {
    needed_leaves = 4096;
  } else if (4097 <= inx && inx <= 8192) {
    needed_leaves = 8192;
  } else if (8193 <= inx && inx <= 16384) {
    needed_leaves = 16384;
  } else if (16385 <= inx && inx <= 32768) {
    needed_leaves = 32768;
  } else if (32769 <= inx && inx <= 65536) {
    needed_leaves = 65536;
  } else if (65537 <= inx && inx <= 131072) {
    needed_leaves = 131072;
  } else if (131073 <= inx && inx <= 262144) {
    needed_leaves = 262144;
  } else if (262145 <= inx && inx <= 524288) {
    needed_leaves = 524288;
  } else if (524289 <= inx && inx <= 1048576) {
    needed_leaves = 1048576;
  } else if (1048577 <= inx && inx <= 2097152) {
    needed_leaves = 2097152;
  } else {
    throw new Error("Invalid leaves");
  }
  return needed_leaves;
}

function inner_merkle(
  elms, //: Vec<String>,
  input_type = "string", //: &String,
  hash_algorithm = "keccak256", //: &String,
  version = "0.0.0"
) {
  //: &String) -> (String, MNodesMapT, usize, usize)
  // let elms = cutils::clone_vec(elms_);
  if (input_type == "string") {
    let hashed_elements = [];
    for (const element of elms) {
      hashed_elements.push(do_hash_a_node(element, hash_algorithm));
    }
    elms = hashed_elements;
  }
  console.log("hashed elms: ", elms);

  let verifies = {};
  let leaves = elms.length;
  let level = 0;
  let parent = "";
  while (level < 100000) {
    level += 1;

    if (elms.length == 1) {
      root = elms[0];
      return {
        root,
        verifies,
        leaves,
        level,
      };
    }

    if (elms.length % 2 == 1) {
      let err_msg = "FATAL ERROR ON MERKLE GENERATING: " + elms;
      console.error(err_msg);
      throw new Error(err_msg);

      // // adding parity right fake hash
      // String the_hash = elms[elms.length - 1];
      // if (version > "0.0.0")
      //     the_hash = constants::FAKE_RIGHT_HASH_PREFIX + the_hash;
      // elms.push(the_hash);
    }

    let chunks = chunk_to_vvstring(elms, 2);
    elms = []; // emptying elements

    for (const chunk of chunks) {
      parent = do_hash_a_node(chunk[0] + chunk[1], hash_algorithm);
      elms.push(parent);
      if (level == 1) {
        let l_key = "l_" + chunk[0];
        let r_key = "r_" + chunk[1];
        let val = getMerkleNodeData([], parent, "", []);
        verifies[l_key] = val;
        val = getMerkleNodeData([], parent, chunk[0], []);
        verifies[r_key] = val;

        let veri = verifies[l_key];
        veri = push_m_merkle_proof(veri, "r." + chunk[1]);
        // verifies.remove(&l_key);
        verifies[l_key] = veri;
      } else {
        // find alter parent cild
        let tmp_verifies = {};

        for (const key of Object.keys(verifies)) {
          let the_verify = verifies[key];
          let mut_verify = the_verify;
          if (chunk[0] == the_verify.m_parent) {
            mut_verify = push_m_merkle_proof(mut_verify, "r." + chunk[1]);
            mut_verify.m_parent = parent;
          }
          if (chunk[1] == the_verify.m_parent) {
            mut_verify = push_m_merkle_proof(mut_verify, "l." + chunk[0]);
            mut_verify.m_parent = parent;
          }
          tmp_verifies[key] = mut_verify;
        }
        // replace changes
        for (const key of Object.keys(tmp_verifies)) {
          let new_verify = tmp_verifies[key];
          // verifies.remove(key);
          verifies[key] = new_verify;
        }
      }
    }
  }

  root = "";
  verifies = {};
  leaves = 0;
  level = 0;
  return {
    root,
    verifies,
    leaves,
    level,
  };
}

function push_m_merkle_proof(veri, pass) {
  veri.m_proof_keys.push(pass);
  return veri;
}

function do_hash_a_node(node_value, hash_algorithm) {
  if (hash_algorithm == "keccak256" || hash_algorithm == "") {
    return doKeccak256(node_value);
  } else if (hash_algorithm == "noHash") {
    return node_value;
  } else if (hash_algorithm == "aliasHash") {
    return "h(".to_owned() + node_value + ")";
  } else {
    let err_msg = "Invalid hash algorithm for merkle!: " + hash_algorithm;
    return err_msg;
  }
}

function getMerkleNodeData(
  m_proof_keys,
  m_parent,
  m_left_hash,
  m_merkle_proof
) {
  return {
    m_proof_keys,
    m_parent,
    m_left_hash,
    m_merkle_proof,
  };
}

function chunk_to_vvstring(values, chunk_size) {
  let out = [];

  if (values.length == 0 || chunk_size == 0) {
    return out;
  }

  if (values.length <= chunk_size) {
    //FIXME let vvv = values.iter().map(|x| x).collect::<Vec<String>>();
    out.push(values);
    return out;
  }

  let the_len = values.length;
  let chunks_count = the_len / chunk_size;
  if (the_len % chunk_size != 0) {
    chunks_count += 1;
  }

  for (let i = 0; i < chunks_count; i++) {
    let end_index;
    if ((i + 1) * chunk_size < values.length) {
      end_index = (i + 1) * chunk_size;
    } else {
      end_index = the_len;
    }
    let a_chunk = values.slice(i * chunk_size, end_index);
    if (a_chunk.length > 0) {
      out.push(a_chunk);
    }
  }

  return out;
  // fill
  //  std::size_t const half_size = lines.length / 2;
  //  T split_lo(lines.begin(), lines.begin() + half_size);
  //  T split_hi(lines.begin() + half_size, lines.end());
}

function validateProof(
  rootHash,
  leave,
  proof_hashes,
  input_type = "hashed",
  hash_algorithm = "keccak256"
) {
  let calculatedRoot = get_root_by_a_prove(
    leave,
    proof_hashes,
    "",
    input_type,
    hash_algorithm
  );
  return calculatedRoot === rootHash;
}

function get_root_by_a_prove(
  leave,
  proof_hashes,
  l_hash,
  input_type = "hashed",
  hash_algorithm = "keccak256"
) {
  if (input_type == "") {
    input_type = "hashed";
  }
  if (hash_algorithm == "") {
    hash_algorithm = "keccak256";
  }
  if (input_type == "string") {
    leave = do_hash_a_node(leave, hash_algorithm);
  }

  let proof;
  if (l_hash != "") {
    proof = do_hash_a_node(l_hash + leave, hash_algorithm);
  } else {
    proof = leave;
  }

  if (proof_hashes.length > 0) {
    for (const element of proof_hashes) {
      let pos = element.substring(0, 1);
      let val = element.substring(2, element.length);
      if (pos == "r") {
        proof = do_hash_a_node(proof + val, hash_algorithm);
      } else {
        proof = do_hash_a_node(val + proof, hash_algorithm);
      }
    }
  }
  return proof;
}

function getProofByLeave(
  proofs,
  leave,
  input_type = "string",
  hash_algorithm = "keccak256",
  version = "0.0.0"
) {
  if (input_type == "string") {
    leave = do_hash_a_node(leave, hash_algorithm);
  }
  let theProof = proofs[leave];
  console.log("theProof: ", theProof);
  if (theProof.m_left_hash) {
    theProof.m_proof_keys.unshift("l." + theProof.m_left_hash);
  }
  return theProof.m_proof_keys;
}

module.exports = {
  doKeccak256,
  generate_m,
  get_root_by_a_prove,
  getProofByLeave,
  validateProof,
};
